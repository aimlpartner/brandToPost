import { VideoLoader } from '../components/VideoLoader';
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { NotFound } from './NotFound';
import { 
 BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
 PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
 Loader2, ShieldAlert, Activity, Database, DollarSign, Bug, AlertCircle, Trash2,
 MessageSquare, Plus, Search, Sparkles, RefreshCw, Clock, ShieldCheck, 
 CheckCircle, CheckCircle2, Smartphone, Send, Languages, Zap, Heart, Filter, Laptop,
 Users, FileText, Lock, Unlock
} from 'lucide-react';
import { logSilentError } from '../lib/firestore-error';

interface TokenLog {
 id: string;
 userId: string;
 operationType: string;
 model: string;
 promptTokenCount: number;
 candidatesTokenCount: number;
 totalTokenCount: number;
 timestamp: string;
}

interface ErrorLog {
 id: string;
 type: string;
 error: string;
 operationType?: string;
 path?: string;
 timestamp: string;
 userId?: string;
 email?: string;
 url?: string;
 userAgent?: string;
 context?: any;
 authInfo?: any;
}

const COLORS = ['#7C3AED', '#2583EB', '#10B981', '#FF7778', '#C084FC'];

// Estimated costs per 1M tokens (as of typical Gemini pricing, adjust as needed)
const PRICING = {
  'gemini-3.1-pro-preview': { prompt: 2.00, candidate: 12.00 },
  'gemini-2.5-flash': { prompt: 0.30, candidate: 2.50 },
  'gemini-2.5-flash-preview': { prompt: 0.30, candidate: 2.50 },
  'gemini-3.1-flash-preview': { prompt: 0.30, candidate: 2.50 },
  'gemini-3.5-flash': { prompt: 0.30, candidate: 2.50 },
  'gemini-3.1-flash-image-preview': { prompt: 0, candidate: 0, perImage: 0.03 }, // $0.03 per image
  'puppeteer-layout-render': { prompt: 0, candidate: 0, perImage: 0.015 }, // $0.015 per render run
  'puppeteer-web-scrape': { prompt: 0, candidate: 0, perImage: 0.015 } // $0.015 per web scrape run
};

const USD_TO_INR = 83.50; // Exchange rate for INR conversion

export default function AdminDashboard() {
 const { user, loading: authLoading } = useAuth();
 const [activeTab, setActiveTab] = useState<'tokens' | 'errors' | 'whatsapp' | 'users' | 'blogs'>('users');
 const [logs, setLogs] = useState<TokenLog[]>([]);
 const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
 const [users, setUsers] = useState<any[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);
 const [deleteFilter, setDeleteFilter] = useState<number | null>(null);

 // Users filtering state
 const [userSearchQuery, setUserSearchQuery] = useState('');
 const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'online' | 'offline'>('all');
 const [userOnboardingFilter, setUserOnboardingFilter] = useState<'all' | 'onboarded' | 'pending'>('all');
 const [userFetchError, setUserFetchError] = useState<string | null>(null);

 // WhatsApp System States
 const [leads, setLeads] = useState<any[]>([]);
 const [loadingLeads, setLoadingLeads] = useState(false);
 const [sieveNiche, setSieveNiche] = useState('Clinics & Surgical Stores');
 const [sieveLocation, setSieveLocation] = useState('South Delhi');
 const [runningMapSieve, setRunningMapSieve] = useState(false);
 const [activeLeadFilter, setActiveLeadFilter] = useState<'ALL' | 'PENDING_OUTREACH' | 'OUTREACH_SENT' | 'INTERACTED'>('ALL');
 const [simulatedMessageStatus, setSimulatedMessageStatus] = useState<string | null>(null);

 // Blogs State
 const [blogs, setBlogs] = useState<any[]>([]);
 const [loadingBlogs, setLoadingBlogs] = useState(false);
 const [selectedBlog, setSelectedBlog] = useState<any | null>(null);
 const [isEditingBlog, setIsEditingBlog] = useState(false);
 const [blogTitle, setBlogTitle] = useState('');
 const [blogSlug, setBlogSlug] = useState('');
 const [blogContent, setBlogContent] = useState('');
 const [blogImageUrl, setBlogImageUrl] = useState('');
 const [blogSummary, setBlogSummary] = useState('');
 const [blogTargetAudience, setBlogTargetAudience] = useState('');
 const [blogCta, setBlogCta] = useState('');
 const [blogStatus, setBlogStatus] = useState<'draft' | 'published'>('draft');
 const [blogTags, setBlogTags] = useState('');
 const [isSavingBlog, setIsSavingBlog] = useState(false);

 // Check if user is admin
 const isAdmin = user?.email === 'garvitbansal2303@gmail.com';

  useEffect(() => {
    if (!isAdmin || activeTab !== 'blogs') return;
    
    const fetchBlogs = async () => {
      setLoadingBlogs(true);
      try {
        const qBlogs = query(collection(db, 'blogs'), orderBy('createdAt', 'desc'));
        const blogsSnapshot = await getDocs(qBlogs);
        const fetchedBlogs: any[] = [];
        blogsSnapshot.forEach((doc) => {
          fetchedBlogs.push({ id: doc.id, ...doc.data() });
        });
        setBlogs(fetchedBlogs);
      } catch (err: any) {
        console.error("Failed to fetch blogs:", err);
        logSilentError(err as Error, { context: "fetchBlogs" });
      } finally {
        setLoadingBlogs(false);
      }
    };
    
    fetchBlogs();
  }, [isAdmin, activeTab]);

  const handleOpenBlogEditor = (blog: any = null) => {
    if (blog) {
      setSelectedBlog(blog);
      setBlogTitle(blog.title || '');
      setBlogSlug(blog.slug || '');
      setBlogContent(blog.content || '');
      setBlogImageUrl(blog.imageUrl || '');
      setBlogSummary(blog.summary || '');
      setBlogTargetAudience(blog.targetAudience || '');
      setBlogCta(blog.cta || '');
      setBlogStatus(blog.status || 'draft');
      setBlogTags(blog.tags ? blog.tags.join(', ') : '');
    } else {
      setSelectedBlog(null);
      setBlogTitle('');
      setBlogSlug('');
      setBlogContent('');
      setBlogImageUrl('');
      setBlogSummary('');
      setBlogTargetAudience('');
      setBlogCta('');
      setBlogStatus('draft');
      setBlogTags('');
    }
    setIsEditingBlog(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogContent.trim()) {
      alert("Title and Content are required.");
      return;
    }

    setIsSavingBlog(true);
    try {
      let slug = blogSlug.trim();
      if (!slug) {
        slug = blogTitle
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/[\s_-]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }

      const tagsArray = blogTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const blogData: any = {
        title: blogTitle,
        slug,
        content: blogContent,
        imageUrl: blogImageUrl,
        summary: blogSummary,
        targetAudience: blogTargetAudience,
        cta: blogCta,
        status: blogStatus,
        tags: tagsArray,
        updatedAt: new Date().toISOString()
      };

      if (selectedBlog) {
        await updateDoc(doc(db, 'blogs', selectedBlog.id), blogData);
        setBlogs(prev => prev.map(b => b.id === selectedBlog.id ? { ...b, ...blogData } : b));
        alert("Blog updated successfully.");
      } else {
        blogData.createdAt = new Date().toISOString();
        if (blogStatus === 'published') {
          blogData.publishedAt = new Date().toISOString();
        }
        const docRef = await addDoc(collection(db, 'blogs'), blogData);
        setBlogs(prev => [{ id: docRef.id, ...blogData }, ...prev]);
        alert("Blog created successfully.");
      }
      setIsEditingBlog(false);
      setSelectedBlog(null);
    } catch (err: any) {
      console.error("Failed to save blog:", err);
      alert(`Failed to save blog: ${err.message}`);
    } finally {
      setIsSavingBlog(false);
    }
  };

  const handleDeleteBlog = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      await deleteDoc(doc(db, 'blogs', blogId));
      setBlogs(prev => prev.filter(b => b.id !== blogId));
      alert("Blog post deleted successfully.");
    } catch (err: any) {
      console.error("Failed to delete blog:", err);
      alert(`Failed to delete blog: ${err.message}`);
    }
  };

 const handleDeleteLogs = async () => {
 if (deleteFilter === null) return;
 
 setIsDeleting(true);
 try {
 let qErrors;
 if (deleteFilter === 0) {
 // All logs
 qErrors = query(collection(db, 'error_logs'));
 } else {
 const cutoffDate = new Date();
 cutoffDate.setDate(cutoffDate.getDate() - deleteFilter);
 qErrors = query(collection(db, 'error_logs'), where('timestamp', '<', cutoffDate.toISOString()));
 }
 
 console.log("Fetching logs to delete...");
 let snapshot;
 try {
 snapshot = await getDocs(qErrors);
 } catch (e: any) {
 throw new Error(`getDocs failed: ${e.message}`);
 }
 
 console.log(`Found ${snapshot.docs.length} logs to delete.`);
 let count = 0;
 
 // Use Promise.all with chunks to avoid batch-specific permission quirks
 const chunkSize = 50;
 for (let i = 0; i < snapshot.docs.length; i += chunkSize) {
 const chunk = snapshot.docs.slice(i, i + chunkSize);
 try {
 await Promise.all(chunk.map(async (document) => {
 try {
 await deleteDoc(doc(db, 'error_logs', document.id));
 } catch (deleteErr: any) {
 console.error(`Failed to delete doc ${document.id}:`, deleteErr);
 throw deleteErr;
 }
 }));
 count += chunk.length;
 } catch (e: any) {
 throw new Error(`Deletion failed at chunk ${i}: ${e.message}`);
 }
 }
 
 if (count > 0) {
 // Update local state
 const cutoffDate = deleteFilter === 0 ? new Date() : new Date(Date.now() - deleteFilter * 24 * 60 * 60 * 1000);
 if (deleteFilter === 0) {
 setErrorLogs([]);
 } else {
 setErrorLogs(prev => prev.filter(log => new Date(log.timestamp) >= cutoffDate));
 }
 alert(`Successfully deleted ${count} error logs.`);
 } else {
 alert('No logs found matching the criteria.');
 }
 } catch (err: any) {
 logSilentError(err as Error, { context: "deleteErrorLogs" });
 alert(`Failed to delete logs: ${err.message}`);
 } finally {
 setIsDeleting(false);
 }
 };

  useEffect(() => {
  if (!isAdmin) return;
 
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setUserFetchError(null);
    
    // 1. Fetch Token Logs
    try {
      const qTokens = query(collection(db, 'token_usage'), orderBy('timestamp', 'desc'), limit(1000));
      const tokenSnapshot = await getDocs(qTokens);
      const fetchedTokenLogs: TokenLog[] = [];
      tokenSnapshot.forEach((doc) => {
        fetchedTokenLogs.push({ id: doc.id, ...doc.data() } as TokenLog);
      });
      setLogs(fetchedTokenLogs);
    } catch (err: any) {
      console.error("Failed to fetch token usage logs:", err);
      logSilentError(err as Error, { context: "fetchTokenUsageLogs" });
    }
 
    // 2. Fetch Error Logs
    try {
      const qErrors = query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(200));
      const errorSnapshot = await getDocs(qErrors);
      const fetchedErrorLogs: ErrorLog[] = [];
      errorSnapshot.forEach((doc) => {
        fetchedErrorLogs.push({ id: doc.id, ...doc.data() } as ErrorLog);
      });
      setErrorLogs(fetchedErrorLogs);
    } catch (err: any) {
      console.error("Failed to fetch error logs:", err);
      logSilentError(err as Error, { context: "fetchErrorLogs" });
    }
  
    // 3. Fetch Users
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const fetchedUsers: any[] = [];
      usersSnapshot.forEach((doc) => {
        fetchedUsers.push({ id: doc.id, ...doc.data() });
      });
      setUsers(fetchedUsers);
    } catch (err: any) {
      console.error("Failed to fetch users profiles:", err);
      logSilentError(err as Error, { context: "fetchUsersProfiles" });
      setUserFetchError(err.message || "Failed to fetch users");
    }
    
    setLoading(false);
  };
 
  fetchData();
  }, [isAdmin]);

  // Account Lock / Eviction Handlers (Server Proxy + Client Fallback)
  const handleToggleUserLock = async (targetUserId: string, currentIsLocked: boolean, userEmail?: string) => {
    const newLockState = !currentIsLocked;
    const actionName = newLockState ? "LOCK & EVICT" : "UNLOCK";
    const defaultReason = "The testing phase is over. Access to your account has been suspended by administration.";

    let lockReason = defaultReason;
    if (newLockState) {
      const customReason = prompt(`Reason for locking account (${userEmail || targetUserId}):`, defaultReason);
      if (customReason === null) return; // User cancelled
      if (customReason.trim()) {
        lockReason = customReason.trim();
      }
    }

    try {
      let serverSuccess = false;
      try {
        const res = await fetch('/api/admin/users/lock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminEmail: user?.email,
            targetUserId,
            isLocked: newLockState,
            lockReason: newLockState ? lockReason : ""
          })
        });

        if (res.ok) {
          serverSuccess = true;
        }
      } catch (e) {
        // Server endpoint fallback to direct Firestore SDK update
      }

      if (!serverSuccess) {
        const userRef = doc(db, 'users', targetUserId);
        const updates: any = { isLocked: newLockState };
        if (newLockState) {
          updates.lockReason = lockReason;
          updates.lockedAt = new Date().toISOString();
        } else {
          updates.lockReason = "";
        }
        await updateDoc(userRef, updates);
      }

      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isLocked: newLockState, lockReason: newLockState ? lockReason : undefined } : u));
      alert(`Successfully ${actionName}ED account for ${userEmail || targetUserId}.`);
    } catch (err: any) {
      console.error("Failed to update user lock state:", err);
      logSilentError(err as Error, { context: "toggleUserLock", targetUserId });
      alert(`Failed to update lock status: ${err.message}`);
    }
  };

  const handleLockAllUsers = async () => {
    const confirmLock = confirm("⚠️ EMERGENCY ACTION: Are you sure you want to LOCK ALL NON-ADMIN USERS?\n\nThis will immediately log out all active users and display: 'The testing phase is over.'");
    if (!confirmLock) return;

    const defaultReason = "The testing phase is over. Access to your account has been suspended by administration.";
    const lockReason = prompt("Enter lock message to display to all locked users:", defaultReason);
    if (lockReason === null) return; // Cancelled
    const finalReason = lockReason.trim() || defaultReason;

    try {
      let serverSuccess = false;
      try {
        const res = await fetch('/api/admin/users/lock-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminEmail: user?.email,
            lockReason: finalReason
          })
        });

        if (res.ok) {
          serverSuccess = true;
        }
      } catch (e) {}

      if (!serverSuccess) {
        const nonAdminUsers = users.filter(u => u.email !== 'garvitbansal2303@gmail.com' && u.role !== 'Admin' && !u.isLocked);
        for (const u of nonAdminUsers) {
          try {
            const userRef = doc(db, 'users', u.id);
            await updateDoc(userRef, {
              isLocked: true,
              lockReason: finalReason,
              lockedAt: new Date().toISOString()
            });
          } catch (e) {
            console.error(`Failed client update for user ${u.id}:`, e);
          }
        }
      }

      setUsers(prev => prev.map(u => (u.email !== 'garvitbansal2303@gmail.com' && u.role !== 'Admin') ? { ...u, isLocked: true, lockReason: finalReason } : u));
      alert(`Successfully locked non-admin user accounts. All active sessions have been evicted.`);
    } catch (err: any) {
      console.error("Failed to lock all users:", err);
      logSilentError(err as Error, { context: "lockAllUsers" });
      alert(`Failed to lock all users: ${err.message}`);
    }
  };

  // WhatsApp System Hooks and actions
  useEffect(() => {
    if (!isAdmin) return;
    
    const loadLeads = async () => {
      setLoadingLeads(true);
      try {
        const qLeads = query(collection(db, "leads"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(qLeads);
        const list: any[] = [];
        snapshot.forEach((document) => {
          list.push({ id: document.id, ...document.data() });
        });
        setLeads(list);
      } catch (err) {
        console.warn("Failed retrieving leads collection: ", err);
      } finally {
        setLoadingLeads(false);
      }
    };

    loadLeads();
  }, [isAdmin, activeTab]);

  // Toggle Lead Status manually
  const handleToggleLeadStatus = async (leadId: string, currentStatus: string) => {
    const nextStatusMap: Record<string, string> = {
      "PENDING_OUTREACH": "OUTREACH_SENT",
      "OUTREACH_SENT": "INTERACTED",
      "INTERACTED": "DEACTIVATED_UNENGAGED",
      "DEACTIVATED_UNENGAGED": "PENDING_OUTREACH"
    };
    const nextStatus = nextStatusMap[currentStatus] || "PENDING_OUTREACH";
    
    try {
      const leadRef = doc(db, "leads", leadId);
      const updates: any = { status: nextStatus };
      if (nextStatus === "OUTREACH_SENT") {
        const checkTime = new Date();
        checkTime.setHours(checkTime.getHours() + 72);
        updates.nextCheckTime = checkTime.toISOString();
      }
      
      await updateDoc(leadRef, updates);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
    } catch (err) {
      alert(`Firestore update failed: ${err}`);
    }
  };

  // Delete Lead record
  const handleDeleteLead = async (leadId: string) => {
    if (!confirm("Are you sure you want to delete this lead?")) return;
    try {
      await deleteDoc(doc(db, "leads", leadId));
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err) {
      alert(`Failed to delete lead: ${err}`);
    }
  };

  // Trigger WhatsApp Template simulation
  const handleTriggerWhatsAppOutreach = async (leadId: string) => {
    setSimulatedMessageStatus("sending");
    try {
      const leadRef = doc(db, "leads", leadId);
      const checkTime = new Date();
      checkTime.setHours(checkTime.getHours() + 72); // 72 Hours TTL

      const updates = {
        status: "OUTREACH_SENT",
        nextCheckTime: checkTime.toISOString(),
        lastCheckedAt: new Date().toISOString()
      };

      await updateDoc(leadRef, updates);
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
      setSimulatedMessageStatus(leadId);
      setTimeout(() => setSimulatedMessageStatus(null), 3000);
    } catch (err) {
      alert(`Outreach trigger failed: ${err}`);
      setSimulatedMessageStatus(null);
    }
  };

  // Run Google Maps Scraper Sieve Simulation
  const handleRunMapsSieve = async () => {
    if (runningMapSieve) return;
    setRunningMapSieve(true);
    
    try {
      const mockPresets = [
        {
          name: `${sieveNiche.replace(/s$/i, "")} Center`,
          phone: "+91 99583 00412",
          address: `Ring Road, Near Metro, ${sieveLocation}`,
          rating: 4.8,
          photosCount: 8,
          originalImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&auto=format&fit=crop&q=80",
          compressedSize: "324 KB",
          originalSize: "4.1 MB",
          status: "PENDING_OUTREACH"
        },
        {
          name: `Primal Healthcare Labs`,
          phone: "+91 88200 11985",
          address: `Sector 4 Market square, ${sieveLocation}`,
          rating: 4.6,
          photosCount: 4,
          originalImage: "https://images.unsplash.com/photo-1579684389782-64d84b5e901a?w=600&auto=format&fit=crop&q=80",
          compressedSize: "288 KB",
          originalSize: "3.5 MB",
          status: "PENDING_OUTREACH"
        },
        {
          name: `General Surgical & Medicos`,
          phone: "011-26419988",
          address: `Outer Circle Ground Floor, ${sieveLocation}`,
          rating: 4.2,
          photosCount: 0,
          originalImage: "",
          compressedSize: "N/A",
          originalSize: "N/A",
          status: "DEACTIVATED_UNENGAGED"
        }
      ];

      for (const item of mockPresets) {
        const payload = {
          ...item,
          language: "Hindi-Mix",
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, "leads"), payload);
        setLeads(prev => [{ id: docRef.id, ...payload }, ...prev]);
      }

      alert(`Successfully simulated Google Places API (New) Scan! Discovered & processed 3 merchants in ${sieveLocation}. Landlines and visual-empty list filtered securely.`);
    } catch (err) {
      alert(`Scraping simulation failed: ${err}`);
    } finally {
      setRunningMapSieve(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <VideoLoader className="h-24 w-24 text-[#7C3AED] mx-auto" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/admin' }} />;
  }

  if (!isAdmin) {
    return <NotFound />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F6]">
        <VideoLoader className="h-24 w-24 text-[#7C3AED] mx-auto" />
      </div>
    );
  }

 if (error) {
 return (
 <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
 <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-6 py-4 rounded-xl flex items-center gap-3">
 <ShieldAlert className="h-6 w-6" />
 <p>{error}</p>
 </div>
 </div>
 );
 }

  // Process data for charts
  
  let totalTokens = 0;
  let totalImages = 0;
  let totalEstimatedCostUSD = 0;
  
  const operationStats: Record<string, number> = {};
  const operationCosts: Record<string, number> = {};
  const operationCounts: Record<string, number> = {};
  const operationPromptTokens: Record<string, number> = {};
  const operationCandidateTokens: Record<string, number> = {};
  const modelStats: Record<string, number> = {};
  const timelineData: Record<string, { date: string, tokens: number, cost: number }> = {};

  logs.forEach(log => {
    const isPerImageModel = log.model === 'gemini-3.1-flash-image-preview' || log.model.startsWith('puppeteer-');
    if (isPerImageModel) {
      if (log.model === 'gemini-3.1-flash-image-preview') {
        totalImages += log.totalTokenCount; // We logged 1 token = 1 image
      }
    } else {
      totalTokens += log.totalTokenCount;
    }
    
    // Calculate cost
    let cost = 0;
    const rates = PRICING[log.model as keyof typeof PRICING] as any;
    if (rates) {
      if (rates.perImage) {
        cost = log.totalTokenCount * rates.perImage;
      } else {
        cost = (log.promptTokenCount / 1000000) * rates.prompt + (log.candidatesTokenCount / 1000000) * rates.candidate;
      }
    }
    totalEstimatedCostUSD += cost;

    // Operation stats
    const statValue = log.totalTokenCount;
    operationStats[log.operationType] = (operationStats[log.operationType] || 0) + statValue;
    operationCosts[log.operationType] = (operationCosts[log.operationType] || 0) + cost;
    operationCounts[log.operationType] = (operationCounts[log.operationType] || 0) + 1;
    
    if (!isPerImageModel) {
      operationPromptTokens[log.operationType] = (operationPromptTokens[log.operationType] || 0) + (log.promptTokenCount || 0);
      operationCandidateTokens[log.operationType] = (operationCandidateTokens[log.operationType] || 0) + (log.candidatesTokenCount || 0);
    } else {
      operationPromptTokens[log.operationType] = 0;
      operationCandidateTokens[log.operationType] = 0;
    }

    // Model stats
    modelStats[log.model] = (modelStats[log.model] || 0) + cost;

    // Timeline stats (group by day)
    const date = new Date(log.timestamp).toLocaleDateString();
    if (!timelineData[date]) {
      timelineData[date] = { date, tokens: 0, cost: 0 };
    }
    if (!isPerImageModel) {
      timelineData[date].tokens += log.totalTokenCount;
    }
    timelineData[date].cost += cost;
  });

  const getFriendlyOperationName = (op: string) => {
    const map: Record<string, string> = {
      researchProductDNA: "Brand DNA Research",
      generateCampaign: "Campaign Generation",
      formatCampaign: "Campaign Copy Formatting",
      regeneratePostWithFeedback: "Post Revision & Feedback",
      generateImage: "AI Image Generation",
      generateOneDayStoryImage: "Story Visual Generation",
      generateFieldSuggestions: "Field Auto-Suggestions",
      puppeteer_overlay_render: "Puppeteer Overlay Flattening",
      puppeteer_web_scrape: "Puppeteer Brand DNA Scraping"
    };
    return map[op] || op;
  };

  const costBreakdownData = Object.entries(operationCosts).map(([name, cost]) => {
    const count = operationCounts[name] || 1;
    const tokens = operationStats[name] || 0;
    const promptTokens = operationPromptTokens[name] || 0;
    const candidateTokens = operationCandidateTokens[name] || 0;
    return {
      name,
      friendlyName: getFriendlyOperationName(name),
      totalCostUsd: cost,
      totalCostInr: cost * USD_TO_INR,
      averageCostUsd: cost / count,
      averageCostInr: (cost * USD_TO_INR) / count,
      count,
      totalTokens: tokens,
      promptTokens,
      candidateTokens
    };
  }).sort((a, b) => b.totalCostUsd - a.totalCostUsd);

  const totalEstimatedCostINR = totalEstimatedCostUSD * USD_TO_INR;

  const operationChartData = Object.entries(operationStats).map(([name, value]) => ({ name, value }));
  const modelChartData = Object.entries(modelStats).map(([name, value]) => ({ name, value }));
  const timelineChartData = Object.values(timelineData).reverse(); // Oldest to newest

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 font-display">Admin Dashboard</h1>
          <p className="text-slate-500 mt-2">System monitoring and analytics</p>
        </div>
        
        <div className="flex bg-slate-100/70 border border-slate-200/50 p-1 rounded-xl w-fit overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'users' 
                ? 'bg-white text-[#7C3AED] shadow-sm border border-slate-200/50 font-semibold' 
                : 'text-slate-550 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Users className="h-4 w-4" />
            Users
            {users.length > 0 && (
              <span className="ml-1.5 bg-purple-50 text-purple-650 border border-purple-100 py-0.5 px-2 rounded-full text-xs font-bold font-mono">
                {users.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('whatsapp')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'whatsapp' 
                ? 'bg-white text-[#7C3AED] shadow-sm border border-slate-200/50 font-semibold' 
                : 'text-slate-550 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            WhatsApp Outreach Sieve
            {leads.length > 0 && (
              <span className="ml-1.5 bg-emerald-50 text-emerald-600 border border-emerald-100 py-0.5 px-2 rounded-full text-xs font-bold font-mono">
                {leads.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tokens' 
                ? 'bg-white text-[#7C3AED] shadow-sm border border-slate-200/50 font-semibold' 
                : 'text-slate-550 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Database className="h-4 w-4" />
            Token Usage
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'errors' 
                ? 'bg-white text-red-600 shadow-sm border border-slate-200/50 font-semibold' 
                : 'text-slate-550 hover:text-red-600 hover:bg-white/40'
            }`}
          >
            <Bug className="h-4 w-4" />
            Error Logs
            {errorLogs.length > 0 && (
              <span className="ml-1.5 bg-red-50 text-red-600 border border-red-100 py-0.5 px-2 rounded-full text-xs font-bold">
                {errorLogs.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('blogs')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'blogs' 
                ? 'bg-white text-[#7C3AED] shadow-sm border border-slate-200/50 font-semibold' 
                : 'text-slate-550 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <FileText className="h-4 w-4" />
            Blogs
          </button>
        </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {userFetchError && (
            <div className="p-4 bg-amber-50/80 border border-amber-200/80 rounded-xl text-amber-800 text-xs font-semibold leading-relaxed">
              <span className="font-bold block mb-1">Firestore Access Warning:</span>
              {userFetchError}. Please make sure you have deployed the latest security rules in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">firestore.rules</code> (run <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px]">firebase deploy --only firestore:rules</code>).
            </div>
          )}
          {/* KPI Counters */}
          {(() => {
            // Precompute stats
            let onlineCount = 0;
            let totalExhaustedINR = 0;

            const usersWithStats = users.map(userItem => {
              // Calculate cost per user
              let userCostUSD = 0;
              logs.forEach(log => {
                if (log.userId === userItem.id) {
                  let cost = 0;
                  const rates = PRICING[log.model as keyof typeof PRICING] as any;
                  if (rates) {
                    if (rates.perImage) {
                      cost = log.totalTokenCount * rates.perImage;
                    } else {
                      cost = (log.promptTokenCount / 1000000) * rates.prompt + (log.candidatesTokenCount / 1000000) * rates.candidate;
                    }
                  }
                  userCostUSD += cost;
                }
              });
              const userCostINR = userCostUSD * USD_TO_INR;
              totalExhaustedINR += userCostINR;

              // Calculate online status
              let lastActivityMs = 0;
              logs.forEach(log => {
                if (log.userId === userItem.id) {
                  const ms = new Date(log.timestamp).getTime();
                  if (ms > lastActivityMs) lastActivityMs = ms;
                }
              });
              errorLogs.forEach(log => {
                if (log.userId === userItem.id) {
                  const ms = new Date(log.timestamp).getTime();
                  if (ms > lastActivityMs) lastActivityMs = ms;
                }
              });

              const isOnline = lastActivityMs > 0 && (Date.now() - lastActivityMs) < 15 * 60 * 1000;
              if (isOnline) onlineCount++;

              return {
                ...userItem,
                costINR: userCostINR,
                lastActivityMs,
                isOnline
              };
            });

            // Filter users
            const filteredUsers = usersWithStats.filter(u => {
              // Search query filter
              if (userSearchQuery) {
                const query = userSearchQuery.toLowerCase();
                const matchesName = u.name?.toLowerCase().includes(query) || u.displayName?.toLowerCase().includes(query);
                const matchesEmail = u.email?.toLowerCase().includes(query);
                if (!matchesName && !matchesEmail) return false;
              }

              // Status filter
              if (userStatusFilter === 'online' && !u.isOnline) return false;
              if (userStatusFilter === 'offline' && u.isOnline) return false;

              // Onboarding filter
              if (userOnboardingFilter === 'onboarded' && !u.onboarded) return false;
              if (userOnboardingFilter === 'pending' && u.onboarded) return false;

              return true;
            });

            const avgExhaustedINR = users.length > 0 ? totalExhaustedINR / users.length : 0;

            const getRelativeTimeString = (ms: number) => {
              if (ms === 0) return "Never active";
              const diffMs = Date.now() - ms;
              const diffMins = Math.floor(diffMs / (60 * 1000));
              const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
              const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

              if (diffMins < 1) return "Just now";
              if (diffMins < 60) return `${diffMins}m ago`;
              if (diffHours < 24) return `${diffHours}h ago`;
              return `${diffDays}d ago`;
            };

            const getInitials = (nameStr: string) => {
              if (!nameStr) return "?";
              const parts = nameStr.split(" ").filter(p => p.trim() !== "");
              if (parts.length === 0) return "?";
              if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
              return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            };

            return (
              <>
                {/* KPI Counters Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="glass-card p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-50 text-[#7C3AED] flex items-center justify-center border border-purple-100">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-sans">Total Registered Users</div>
                      <div className="text-2xl font-bold text-slate-800">{users.length}</div>
                    </div>
                  </div>
                  <div className="glass-card p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 relative">
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-sans">Active Online Users</div>
                      <div className="text-2xl font-bold text-slate-800">{onlineCount}</div>
                    </div>
                  </div>
                  <div className="glass-card p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-650 flex items-center justify-center border border-amber-100">
                      <span className="text-amber-600 font-bold text-xl">₹</span>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-sans">Total Budget Spent</div>
                      <div className="text-2xl font-bold text-emerald-700">₹{totalExhaustedINR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                  <div className="glass-card p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs text-slate-500 font-sans">Avg Cost / User</div>
                      <div className="text-2xl font-bold text-slate-800">₹{avgExhaustedINR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    </div>
                  </div>
                </div>

                {/* Control bar */}
                <div className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      placeholder="Search users by name or email..."
                      className="glass-input pl-10 pr-4 py-2 text-sm text-slate-800 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
                      <select
                        value={userStatusFilter}
                        onChange={(e) => setUserStatusFilter(e.target.value as any)}
                        className="glass-input text-xs py-1.5 px-3 border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-slate-800 outline-none w-[120px]"
                      >
                        <option value="all">All</option>
                        <option value="online">Online</option>
                        <option value="offline">Offline</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Onboarding:</span>
                      <select
                        value={userOnboardingFilter}
                        onChange={(e) => setUserOnboardingFilter(e.target.value as any)}
                        className="glass-input text-xs py-1.5 px-3 border border-slate-200 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-slate-800 outline-none w-[150px]"
                      >
                        <option value="all">All</option>
                        <option value="onboarded">Onboarded</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>

                    <button
                      onClick={handleLockAllUsers}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm flex items-center gap-1.5"
                      title="Lock all non-admin users and force sign out"
                    >
                      <Lock className="w-3.5 h-3.5" /> Emergency Lock All Users
                    </button>
                  </div>
                </div>

                {/* Users Table */}
                <div className="glass-card p-6 overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-slate-700 font-sans">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-mono text-slate-400 uppercase">
                          <th className="py-3 px-2">User Profile</th>
                          <th className="py-3 px-2">Contact & Role</th>
                          <th className="py-3 px-2">Onboarded</th>
                          <th className="py-3 px-2">Real-time status</th>
                          <th className="py-3 px-2">Lock Status</th>
                          <th className="py-3 px-2 text-right">Rupees Exhausted</th>
                          <th className="py-3 px-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-650">
                        {filteredUsers.map((u) => {
                          const userName = u.displayName || u.name || "Anonymous User";
                          const initials = getInitials(userName);
                          return (
                            <tr key={u.id} className="hover:bg-slate-50/50 transition-colors text-xs font-light">
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-3">
                                  {u.photoURL ? (
                                    <img
                                      src={u.photoURL}
                                      alt={userName}
                                      className="h-9 w-9 rounded-full object-cover border border-slate-200"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs border border-slate-200 select-none">
                                      {initials}
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-bold text-slate-800">{userName}</div>
                                    <div className="text-[10px] text-slate-450 mt-0.5">ID: {u.id.substring(0, 8)}...</div>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                <div className="text-slate-655 font-mono">{u.email || "No Email"}</div>
                                <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider ${
                                    u.role === 'Admin' ? 'bg-purple-50 text-purple-650 border border-purple-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                                  }`}>
                                    {u.role || 'User'}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                {u.onboarded ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Complete
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full text-[10px] font-semibold">
                                    <Clock className="w-3.5 h-3.5 animate-pulse" /> Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  {u.isOnline ? (
                                    <>
                                      <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                      </span>
                                      <span className="font-semibold text-emerald-705">Online</span>
                                    </>
                                  ) : (
                                    <>
                                      <span className="inline-flex rounded-full h-2 w-2 bg-slate-350"></span>
                                      <span className="text-slate-450">Offline ({getRelativeTimeString(u.lastActivityMs)})</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-2">
                                {u.isLocked ? (
                                  <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    <Lock className="w-3 h-3 text-rose-600" /> Locked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                                    <Unlock className="w-3 h-3 text-emerald-600" /> Active
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right font-semibold font-mono text-emerald-750 text-sm">
                                ₹{u.costINR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td className="py-3 px-2 text-right">
                                {u.email !== 'garvitbansal2303@gmail.com' && u.role !== 'Admin' && (
                                  <button
                                    onClick={() => handleToggleUserLock(u.id, !!u.isLocked, u.email)}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm inline-flex items-center gap-1 ${
                                      u.isLocked
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                                    }`}
                                  >
                                    {u.isLocked ? (
                                      <>
                                        <Unlock className="w-3.5 h-3.5" /> Unlock
                                      </>
                                    ) : (
                                      <>
                                        <Lock className="w-3.5 h-3.5" /> Lock & Log Out
                                      </>
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {filteredUsers.length === 0 && (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-455 font-light">
                              No users match the search and filter criteria.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      )}

      {activeTab === 'whatsapp' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* KPI Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-sans">Total Leads Ingested</div>
                <div className="text-2xl font-bold text-slate-800">{leads.length}</div>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-sans">Outreach Deliveries</div>
                <div className="text-2xl font-bold text-slate-800">
                  {leads.filter(l => l.status === 'OUTREACH_SENT').length}
                </div>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                <Sparkles className="w-5 h-5 font-bold" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-sans">Customer Responses</div>
                <div className="text-2xl font-bold text-slate-800">
                  {leads.filter(l => l.status === 'INTERACTED').length}
                </div>
              </div>
            </div>
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-red-50 text-red-650 flex items-center justify-center border border-red-100">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-500 font-sans font-medium">Pruned & Deactivated</div>
                <div className="text-2xl font-bold text-slate-800">
                  {leads.filter(l => l.status === 'DEACTIVATED_UNENGAGED').length}
                </div>
              </div>
            </div>
          </div>

          {/* Grid: Map Sieve + Leads List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Scraper / Sieve Simulation */}
            <div className="space-y-6">
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 font-display">
                  <Zap className="text-emerald-500 w-5 h-5 fill-emerald-500/10" /> Map Sieve & Pipeline Simulator
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed mb-4 font-light">
                  Simulate scraping Google Places listings, filter landlines, compress cover images to WebP &lt; 1MB, and save to your Cloud Firestore records.
                </p>

                <div className="space-y-4 font-sans text-xs">
                  <div>
                    <label className="block text-xs uppercase text-slate-500 font-semibold mb-1.5 font-sans">Target Niche</label>
                    <select 
                      value={sieveNiche}
                      onChange={(e) => setSieveNiche(e.target.value)}
                      className="glass-input px-3 py-2 text-sm text-slate-800 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none"
                    >
                      <option value="Clinics & Surgical Stores">🏥 Clinics & Surgical Stores</option>
                      <option value="Chemist & Medicos">💊 Chemist Shop</option>
                      <option value="Ayurvedic Wellness">🌿 Ayurvedic Stores</option>
                      <option value="Organic Superfoods">🥗 Organic Groceries</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs uppercase text-slate-500 font-semibold mb-1.5 font-sans">Local Address Area</label>
                    <input 
                      type="text"
                      value={sieveLocation}
                      onChange={(e) => setSieveLocation(e.target.value)}
                      placeholder="e.g. South Delhi"
                      className="glass-input px-3 py-2 text-sm text-slate-800 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] outline-none"
                    />
                  </div>

                  <button
                    onClick={handleRunMapsSieve}
                    disabled={runningMapSieve}
                    className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 font-bold text-sm text-white rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-sm border border-emerald-500/20"
                  >
                    {runningMapSieve ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-white" /> Gathering Places API...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 text-white" /> Trigger Automated Sieve Scan
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="glass-card p-6">
                <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2 font-display">
                  <ShieldCheck className="text-blue-500 w-5 h-5" /> TTL Automatic Deactivation
                </h3>
                <p className="text-xs text-slate-550 leading-relaxed font-light font-sans">
                  Leads in the collection have a 72-hour TTL (Time-To-Live) window. If the merchant fails to respond within this countdown, their localized creative links are archived to keep storage bloating to a minimum!
                </p>
              </div>
            </div>

            {/* Lead Table List */}
            <div className="lg:col-span-2 glass-card p-6 overflow-hidden flex flex-col">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-display">Discovered Lead Records</h3>
                  <p className="text-xs text-slate-400 font-sans">All live data rows stored in Firestore db</p>
                </div>

                {/* Filter */}
                <div className="flex bg-slate-100/80 p-0.5 rounded-lg text-xs border border-slate-200/60 overflow-x-auto gap-1">
                  {(["ALL", "PENDING_OUTREACH", "OUTREACH_SENT", "INTERACTED"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveLeadFilter(f)}
                      className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                        activeLeadFilter === f 
                          ? 'bg-white text-slate-800 shadow-sm border border-slate-200/50 font-semibold' 
                          : 'text-slate-505 hover:text-slate-800'
                      }`}
                    >
                      {f.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actual List */}
              <div className="overflow-x-auto flex-1 [&::-webkit-scrollbar]:hidden font-sans font-light">
                {loadingLeads ? (
                  <div className="py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[#10B981]" />
                    <p className="text-xs text-slate-400 mt-2">Connecting to Firestore collections...</p>
                  </div>
                ) : leads.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-slate-200 rounded-2xl">
                    <MessageSquare className="w-8 h-8 mx-auto text-slate-400 mb-2 animate-pulse" />
                    <p className="text-sm text-slate-800 font-semibold font-display">No active lead data stored yet</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 font-light font-sans">Use the left Scan simulator to run a live Google Maps sieve pipeline!</p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse text-slate-700 font-sans">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-mono text-slate-400 uppercase">
                        <th className="py-3 px-2">Merchant Name</th>
                        <th className="py-3 px-2">Phone & Address</th>
                        <th className="py-3 px-2">WebP Space ratio</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Outreach triggers</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-650">
                      {leads
                        .filter(l => activeLeadFilter === 'ALL' ? true : l.status === activeLeadFilter)
                        .map((lead) => {
                          const isUnengaged = lead.status === 'DEACTIVATED_UNENGAGED';
                          return (
                            <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors text-xs font-light">
                              <td className="py-3 px-2 max-w-[140px]">
                                <div className="font-bold text-slate-800 truncate">{lead.name}</div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                  ⭐ {lead.rating} | {lead.photosCount} photos
                                </div>
                              </td>
                              <td className="py-3 px-2 max-w-[170px]">
                                <div className="text-slate-650 font-mono truncate">{lead.phone}</div>
                                <div className="text-[10px] text-slate-400 truncate mt-0.5 leading-snug">{lead.address}</div>
                              </td>
                              <td className="py-3 px-2">
                                {lead.compressedSize && lead.compressedSize !== "N/A" ? (
                                  <div>
                                    <span className="font-mono text-[#10B981] font-bold">{lead.compressedSize}</span>
                                    <div className="text-[9px] text-slate-400 italic font-light">Saved ~91%</div>
                                  </div>
                                ) : (
                                  <span className="text-amber-600 px-1.5 py-0.5 rounded bg-amber-50 border border-amber-250/50 text-[10px] font-mono">No Canvas</span>
                                )}
                              </td>
                              <td className="py-3 px-2">
                                <span 
                                  onClick={() => handleToggleLeadStatus(lead.id, lead.status)}
                                  className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase cursor-pointer select-none transition-all hover:scale-105 active:scale-95 ${
                                    lead.status === 'PENDING_OUTREACH' ? 'bg-amber-50 text-amber-700 border border-amber-200/80' :
                                    lead.status === 'OUTREACH_SENT' ? 'bg-blue-50 text-blue-700 border border-blue-200/80' :
                                    lead.status === 'INTERACTED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80' :
                                    'bg-slate-50 text-slate-500 border border-slate-200'
                                  }`}
                                >
                                  {lead.status.replace("_", " ")}
                                </span>
                                {lead.nextCheckTime && lead.status === 'OUTREACH_SENT' && (
                                  <div className="text-[8px] text-slate-400 flex items-center gap-0.5 mt-1 font-mono">
                                    <Clock className="w-2.5 h-2.5 text-blue-500" /> 71h TTL
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-2 text-right font-sans">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => handleTriggerWhatsAppOutreach(lead.id)}
                                    disabled={isUnengaged}
                                    className={`px-2.5 py-1.5 rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
                                      simulatedMessageStatus === lead.id 
                                        ? 'bg-[#10B981] text-white font-semibold' 
                                        : 'bg-slate-50 border border-slate-205 hover:bg-slate-100 text-slate-700'
                                    }`}
                                  >
                                    {simulatedMessageStatus === 'sending' ? (
                                      <RefreshCw className="w-3 h-3 animate-spin text-slate-600" />
                                    ) : simulatedMessageStatus === lead.id ? (
                                      <>
                                        <CheckCircle2 className="w-3 h-3 text-white" /> Sent!
                                      </>
                                    ) : (
                                      <>
                                        <Smartphone className="w-3 h-3 text-[#10B981]" /> Send Pitch
                                      </>
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border border-red-100 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* STEP-BY-STEP WHATSAPP BUSINESS SETUP GUIDE */}
          <div className="glass-card p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#7C3AED]/5 rounded-full blur-3xl"></div>
            
            <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-3 font-display">
              <Smartphone className="w-6 h-6 text-[#7C3AED]" /> Tror WhatsApp Cloud API integration & Setup Manual
            </h2>
            
            <p className="text-sm text-slate-555 max-w-4xl mb-8 leading-relaxed font-light">
              Since all general customer outreach interactions happen over WhatsApp securely, follow this guide to link the Meta Developers suite with our custom active webhook systems.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
              <div className="bg-white/80 p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-55 text-emerald-600 flex items-center justify-center font-bold text-sm font-mono border border-emerald-100">1</div>
                <h4 className="font-bold text-slate-800 text-base">Create Meta Developer App</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-sans font-light">
                  Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-[#7C3AED] hover:underline font-semibold">developers.facebook.com</a>, register, create a new <strong>Business Type</strong> application, and enable the <strong>WhatsApp</strong> product.
                </p>
              </div>

              <div className="bg-white/80 p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-55 text-emerald-600 flex items-center justify-center font-bold text-sm font-mono border border-emerald-100">2</div>
                <h4 className="font-bold text-slate-800 text-base">Generate Permanent Token</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-light font-sans font-light font-light">
                  Avoid temporal test tokens. Go to your Meta Business Manager, create a new <strong>System User</strong>, authorize WhatsApp assets, and grant full <strong>whatsapp_business_messaging</strong> permissions.
                </p>
              </div>

              <div className="bg-white/80 p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-55 text-emerald-600 flex items-center justify-center font-bold text-sm font-mono border border-emerald-100">3</div>
                <h4 className="font-bold text-slate-800 text-base font-semibold">Setup Webhook URL</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-light font-sans font-light font-sans font-light">
                  In Meta App Dashboard, navigate to WhatsApp - Configuration. Paste your Live URL endpoint: <code className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono">https://brandtopost.com/api/whatsapp</code>. Verify using secrets token <strong>TROR_WEBHOOK_SECURE_KEY</strong>.
                </p>
              </div>

              <div className="bg-white/80 p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#10B910]/15 text-emerald-600 flex items-center justify-center font-bold text-sm font-mono border border-emerald-100">4</div>
                <h4 className="font-bold text-slate-800 text-base">Subscribe to Event Topics</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-light font-sans font-light font-sans font-light">
                  Choose <strong>messages</strong> and <strong>message_templates</strong> hooks as active subscriptions. This updates the customer response state in real-time when they type any layout letters back!
                </p>
              </div>

              <div className="bg-white/80 p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#10B910]/15 text-emerald-600 flex items-center justify-center font-bold text-sm font-mono border border-emerald-100">5</div>
                <h4 className="font-bold text-slate-800 text-base">Build Media Templates</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-light font-sans font-light font-sans">
                  Submit your story layout templates for approval inside Meta Business Suite. Ensure header parameter utilizes <strong>JPEG/PNG (WebP Optimized)</strong> media formats so creatives load lightning-fast.
                </p>
              </div>

              <div className="bg-white/80 p-5 rounded-xl border border-slate-200/80 space-y-3 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#10B910]/15 text-emerald-650 flex items-center justify-center font-bold text-sm font-mono border border-emerald-100">6</div>
                <h4 className="font-bold text-slate-800 text-base font-semibold">Configure Env Variables</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-light font-sans font-light font-sans font-light">
                  Set <code className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono">WHATSAPP_TOKEN</code> and <code className="text-[10px] text-slate-700 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-mono">PHONE_NUMBER_ID</code> inside settings. Your automated robotic assistant is now fully integrated.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tokens' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#2583EB]/10 flex items-center justify-center">
                <Activity className="h-6 w-6 text-[#2583EB]" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total API Calls</p>
                <p className="text-2xl font-bold text-slate-800">{logs.length}</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center">
                <Database className="h-6 w-6 text-purple-650" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Tokens / Images</p>
                <p className="text-lg font-bold text-slate-800">{totalTokens.toLocaleString()} / {totalImages}</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <DollarSign className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Estimated Cost (USD)</p>
                <p className="text-2xl font-bold text-emerald-700">${totalEstimatedCostUSD.toFixed(4)}</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                <span className="text-emerald-600 font-bold text-xl">₹</span>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Estimated Cost (INR)</p>
                <p className="text-2xl font-bold text-emerald-700">₹{totalEstimatedCostINR.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tokens by Operation */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Tokens by Operation</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={operationChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }}
                      cursor={{fill: 'rgba(0,0,0,0.02)'}}
                    />
                    <Bar dataKey="value" fill="#7C3AED" radius={[4, 4, 0, 0]} name="Tokens" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tokens by Model */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-6">Cost by Model (USD)</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={modelChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({name, percent}) => `${name.replace('gemini-','')} (${(percent * 100).toFixed(0)}%)`}
                      labelLine={false}
                    >
                      {modelChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Timeline Chart */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Usage Timeline (Tokens)</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0F172A', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)' }} />
                  <Line type="monotone" dataKey="tokens" stroke="#7C3AED" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Tokens" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cost & Tokens by Process */}
          <div className="glass-card p-6 overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Cost & Tokens by Process</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Process (Operation)</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Run Count</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Prompt Tokens</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Candidate Tokens</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Tokens / Img</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Cost (USD)</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Cost (INR)</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Avg Cost / Run</th>
                  </tr>
                </thead>
                <tbody>
                  {costBreakdownData.map((row) => (
                    <tr key={row.name} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-sm text-slate-800 font-medium whitespace-nowrap">
                        {row.friendlyName}
                        <span className="text-[10px] text-slate-400 block font-mono mt-0.5">{row.name}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-center font-mono">
                        {row.count}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-650 text-right font-mono">
                        {row.name === 'generateImage' || row.name === 'generateOneDayStoryImage' ? '-' : row.promptTokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-650 text-right font-mono">
                        {row.name === 'generateImage' || row.name === 'generateOneDayStoryImage' ? '-' : row.candidateTokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right font-mono">
                        {row.name === 'generateImage' || row.name === 'generateOneDayStoryImage' 
                          ? `${row.totalTokens} img` 
                          : row.totalTokens.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-700 text-right font-mono">
                        ${row.totalCostUsd.toFixed(4)}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-emerald-700 text-right font-mono">
                        ₹{row.totalCostInr.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600 text-right font-mono">
                        ${row.averageCostUsd.toFixed(4)} <span className="text-slate-400 text-xs">/ ₹{row.averageCostInr.toFixed(2)}</span>
                      </td>
                    </tr>
                  ))}
                  {costBreakdownData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-light">
                        No process logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent API Logs Table */}
          <div className="glass-card p-6 overflow-hidden">
            <h3 className="text-lg font-semibold text-slate-800 mb-6">Recent API Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operation</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Prompt</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Candidate</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Cost (USD)</th>
                    <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Cost (INR)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.slice(0, 20).map((log) => {
                    let logCost = 0;
                    const rates = PRICING[log.model as keyof typeof PRICING] as any;
                    if (rates) {
                      if (rates.perImage) {
                        logCost = log.totalTokenCount * rates.perImage;
                      } else {
                        logCost = (log.promptTokenCount / 1000000) * rates.prompt + (log.candidatesTokenCount / 1000000) * rates.candidate;
                      }
                    }
                    return (
                      <tr key={log.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-sm text-slate-650 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-800 font-medium">
                          {getFriendlyOperationName(log.operationType)}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-500 font-mono text-[11px]">
                          {log.model}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right font-mono">
                          {log.promptTokenCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right font-mono">
                          {log.candidatesTokenCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-800 text-right font-mono">
                          {rates?.perImage ? (log.model.startsWith('puppeteer-') ? `${log.totalTokenCount} run` : `${log.totalTokenCount} img`) : log.totalTokenCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-emerald-700 text-right font-mono">
                          ${logCost.toFixed(5)}
                        </td>
                        <td className="py-3 px-4 text-sm font-semibold text-emerald-700 text-right font-mono">
                          ₹{(logCost * USD_TO_INR).toFixed(3)}
                        </td>
                      </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 font-light">
                        No token usage logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-red-500">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-red-50 text-red-650 flex items-center justify-center shrink-0 border border-red-100">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Total Logged Errors</p>
                <p className="text-2xl font-bold text-slate-800">{errorLogs.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-2 rounded-xl">
              <select 
                value={deleteFilter === null ? "" : deleteFilter}
                onChange={(e) => setDeleteFilter(e.target.value === "" ? null : Number(e.target.value))}
                className="glass-input bg-white border border-slate-200 text-sm py-2 px-3 focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] text-slate-800 outline-none"
              >
                <option value="">Select logs to delete...</option>
                <option value="30">Older than 30 days</option>
                <option value="7">Older than 7 days</option>
                <option value="1">Older than 1 day</option>
                <option value="0">All logs</option>
              </select>
              <button
                onClick={handleDeleteLogs}
                disabled={deleteFilter === null || isDeleting}
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Trash2 className="h-4 w-4 text-white" />}
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {errorLogs.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="mx-auto h-16 w-16 bg-emerald-50 border border-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-800">All Systems Operational</h3>
                <p className="text-slate-500 mt-2">No errors have been logged recently.</p>
              </div>
            ) : (
              errorLogs.map((log) => (
                <div key={log.id} className="glass-card p-6 border border-slate-200 hover:border-[#7C3AED]/20 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {log.type === 'firestore_error' ? (
                          <Database className="h-5 w-5 text-orange-500" />
                        ) : (
                          <Bug className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                            log.type === 'firestore_error' 
                              ? 'bg-orange-50 text-orange-700 border-orange-100' 
                              : 'bg-red-50 text-red-650 border-red-100'
                          }`}>
                            {log.type === 'firestore_error' ? 'Firestore DB' : 'Application'}
                          </span>
                          <span className="text-sm font-medium text-slate-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-800 break-all">{log.error}</h4>
                      </div>
                    </div>
                    
                    {log.email && (
                      <div className="text-sm bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shrink-0">
                        <span className="text-slate-500 font-light">User: </span>
                        <span className="font-semibold text-slate-800">{log.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-650 overflow-x-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      {log.operationType && (
                        <div><span className="text-slate-400">Operation:</span> <span className="text-slate-700">{log.operationType}</span></div>
                      )}
                      {log.path && (
                        <div><span className="text-slate-400">DB Path:</span> <span className="text-slate-700">{log.path}</span></div>
                      )}
                      {log.url && (
                        <div className="col-span-full"><span className="text-slate-400">URL:</span> <span className="text-slate-700 break-all">{log.url}</span></div>
                      )}
                      {log.userAgent && (
                        <div className="col-span-full"><span className="text-slate-400">User Agent:</span> <span className="text-slate-700">{log.userAgent}</span></div>
                      )}
                    </div>
                    
                    {log.context && Object.keys(log.context).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-205/60">
                        <span className="text-slate-400 block mb-1">Context:</span>
                        <pre className="text-[11px] whitespace-pre-wrap text-slate-700 bg-white border border-slate-200 p-2.5 rounded-lg mt-1 max-h-[300px] overflow-y-auto">{JSON.stringify(log.context, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'blogs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex justify-between items-center border-b border-slate-900/10 pb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-display">Blogs Section</h2>
              <p className="text-xs text-slate-500 mt-1">Create, edit, and publish blogs directly on the website</p>
            </div>
            {!isEditingBlog && (
              <button
                onClick={() => handleOpenBlogEditor(null)}
                className="inline-flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer border-none"
              >
                <Plus className="h-3.5 w-3.5" />
                New Blog Post
              </button>
            )}
          </div>

          {isEditingBlog ? (
            <form onSubmit={handleSaveBlog} className="bg-[#FAF9F6] border border-slate-900/10 rounded-xl p-6 space-y-4 text-slate-800">
              <div className="flex justify-between items-center border-b border-slate-900/10 pb-3">
                <h3 className="text-sm font-bold text-slate-900 font-mono">
                  {selectedBlog ? 'Edit Blog Post' : 'Create New Blog Post'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingBlog(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Title</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter blog title"
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Slug (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. digital-marketing-guide (auto-generated if empty)"
                    value={blogSlug}
                    onChange={(e) => setBlogSlug(e.target.value)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col md:col-span-2 gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Image URL</label>
                  <input
                    type="text"
                    placeholder="Paste image URL or leave empty"
                    value={blogImageUrl}
                    onChange={(e) => setBlogImageUrl(e.target.value)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col md:col-span-2 gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Summary / Core Message</label>
                  <textarea
                    rows={2}
                    placeholder="Brief description showing on index cards"
                    value={blogSummary}
                    onChange={(e) => setBlogSummary(e.target.value)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED] resize-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Audience (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. B2B Founders"
                    value={blogTargetAudience}
                    onChange={(e) => setBlogTargetAudience(e.target.value)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-505 uppercase tracking-wider">CTA text/link (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Sign up today!"
                    value={blogCta}
                    onChange={(e) => setBlogCta(e.target.value)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tags (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. SaaS, Marketing, GTM"
                    value={blogTags}
                    onChange={(e) => setBlogTags(e.target.value)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Publishing Status</label>
                  <select
                    value={blogStatus}
                    onChange={(e) => setBlogStatus(e.target.value as any)}
                    className="border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Content (Markdown supported)</label>
                <textarea
                  rows={15}
                  required
                  placeholder="Write blog content in Markdown format..."
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  className="border border-slate-200 bg-white p-3 font-sans text-xs text-slate-800 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingBlog(false)}
                  className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBlog}
                  className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all shadow-sm cursor-pointer border-none"
                >
                  {isSavingBlog ? 'Saving...' : 'Save Blog Post'}
                </button>
              </div>
            </form>
          ) : (
            <div className="bg-[#FAF9F6] border border-slate-900/10 rounded-xl overflow-hidden text-slate-800">
              {loadingBlogs ? (
                <div className="p-12 text-center">
                  <Loader2 className="h-8 w-8 text-[#7C3AED] animate-spin mx-auto" />
                  <p className="text-xs text-slate-550 mt-2">Loading blog posts...</p>
                </div>
              ) : blogs.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  <p className="text-xs">No blog posts found. Create your first blog post to get started!</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-slate-700 font-light">
                    <thead>
                      <tr className="border-b border-slate-900/10 text-[10px] font-mono text-slate-450 uppercase bg-slate-100/50 font-semibold">
                        <th className="py-3 px-4">Title</th>
                        <th className="py-3 px-4">Slug</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Created At</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-xs text-slate-800">
                      {blogs.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-100/30 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-slate-800 max-w-xs truncate">{b.title}</td>
                          <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">{b.slug}</td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              b.status === 'published'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                            {new Date(b.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                            <button
                              onClick={() => handleOpenBlogEditor(b)}
                              className="text-[#7C3AED] hover:underline font-semibold bg-transparent border-none cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(b.id)}
                              className="text-red-650 hover:underline font-semibold bg-transparent border-none cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

