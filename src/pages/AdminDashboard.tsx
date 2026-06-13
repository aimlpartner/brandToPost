import { VideoLoader } from '../components/VideoLoader';
import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, doc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
 BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
 PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
 Loader2, ShieldAlert, Activity, Database, DollarSign, Bug, AlertCircle, Trash2,
 MessageSquare, Plus, Search, Sparkles, RefreshCw, Clock, ShieldCheck, 
 CheckCircle, CheckCircle2, Smartphone, Send, Languages, Zap, Heart, Filter, Laptop
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// Estimated costs per 1M tokens (as of typical Gemini pricing, adjust as needed)
const PRICING = {
  'gemini-3.1-pro-preview': { prompt: 2.00, candidate: 12.00 },
  'gemini-2.5-flash': { prompt: 0.30, candidate: 2.50 },
  'gemini-2.5-flash-preview': { prompt: 0.30, candidate: 2.50 },
  'gemini-3.1-flash-preview': { prompt: 0.30, candidate: 2.50 },
  'gemini-3.5-flash': { prompt: 0.30, candidate: 2.50 },
  'gemini-3.1-flash-image-preview': { prompt: 0, candidate: 0, perImage: 0.03 } // $0.03 per image
};

const USD_TO_INR = 83.50; // Exchange rate for INR conversion

export default function AdminDashboard() {
 const { user } = useAuth();
 const [activeTab, setActiveTab] = useState<'tokens' | 'errors' | 'whatsapp'>('whatsapp');
 const [logs, setLogs] = useState<TokenLog[]>([]);
 const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [isDeleting, setIsDeleting] = useState(false);
 const [deleteFilter, setDeleteFilter] = useState<number | null>(null);

 // WhatsApp System States
 const [leads, setLeads] = useState<any[]>([]);
 const [loadingLeads, setLoadingLeads] = useState(false);
 const [sieveNiche, setSieveNiche] = useState('Clinics & Surgical Stores');
 const [sieveLocation, setSieveLocation] = useState('South Delhi');
 const [runningMapSieve, setRunningMapSieve] = useState(false);
 const [activeLeadFilter, setActiveLeadFilter] = useState<'ALL' | 'PENDING_OUTREACH' | 'OUTREACH_SENT' | 'INTERACTED'>('ALL');
 const [simulatedMessageStatus, setSimulatedMessageStatus] = useState<string | null>(null);

 // Check if user is admin
 const isAdmin = user?.email === 'garvitbansal2303@gmail.com';

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
 try {
 // Fetch Token Logs
 const qTokens = query(collection(db, 'token_usage'), orderBy('timestamp', 'desc'), limit(500));
 const tokenSnapshot = await getDocs(qTokens);
 const fetchedTokenLogs: TokenLog[] = [];
 tokenSnapshot.forEach((doc) => {
 fetchedTokenLogs.push({ id: doc.id, ...doc.data() } as TokenLog);
 });
 setLogs(fetchedTokenLogs);

 // Fetch Error Logs
 const qErrors = query(collection(db, 'error_logs'), orderBy('timestamp', 'desc'), limit(100));
 const errorSnapshot = await getDocs(qErrors);
 const fetchedErrorLogs: ErrorLog[] = [];
 errorSnapshot.forEach((doc) => {
 fetchedErrorLogs.push({ id: doc.id, ...doc.data() } as ErrorLog);
 });
 setErrorLogs(fetchedErrorLogs);

 } catch (err: any) {
 logSilentError(err as Error, { context: "fetchAdminData" });
 setError(err.message || "Failed to load admin data.");
 } finally {
 setLoading(false);
 }
 };

 fetchData();
 }, [isAdmin]);

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

 if (!isAdmin) {
 return <Navigate to="/dashboard" replace />;
 }

 if (loading) {
 return (
 <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
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
    if (log.model === 'gemini-3.1-flash-image-preview') {
      totalImages += log.totalTokenCount; // We logged 1 token = 1 image
    } else {
      totalTokens += log.totalTokenCount;
    }
    
    // Calculate cost
    let cost = 0;
    const rates = PRICING[log.model as keyof typeof PRICING] as any;
    if (rates) {
      if (log.model === 'gemini-3.1-flash-image-preview' && rates.perImage) {
        cost = log.totalTokenCount * rates.perImage;
      } else {
        cost = (log.promptTokenCount / 1000000) * rates.prompt + (log.candidatesTokenCount / 1000000) * rates.candidate;
      }
    }
    totalEstimatedCostUSD += cost;

    // Operation stats
    const statValue = log.model === 'gemini-3.1-flash-image-preview' ? log.totalTokenCount : log.totalTokenCount;
    operationStats[log.operationType] = (operationStats[log.operationType] || 0) + statValue;
    operationCosts[log.operationType] = (operationCosts[log.operationType] || 0) + cost;
    operationCounts[log.operationType] = (operationCounts[log.operationType] || 0) + 1;
    
    if (log.model !== 'gemini-3.1-flash-image-preview') {
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
    if (log.model !== 'gemini-3.1-flash-image-preview') {
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
      generateFieldSuggestions: "Field Auto-Suggestions"
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
 <h1 className="text-3xl font-bold text-white font-display">Admin Dashboard</h1>
 <p className="text-gray-300 mt-2">System monitoring and analytics</p>
 </div>
 
 <div className="flex bg-[#1C1C22]/50 p-1 rounded-xl ring-1 ring-black/5 w-fit overflow-x-auto gap-1">
	<button
	onClick={() => setActiveTab('whatsapp')}
	className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
	activeTab === 'whatsapp' 
	? 'bg-[#1C1C22] text-[#10B981] shadow-sm ring-1 ring-black/5' 
	: 'text-gray-300 hover:text-white hover:bg-[#1C1C22]/50 border-[#7C3AED]/20'
	}`}
	>
	<MessageSquare className="h-4 w-4" />
	WhatsApp Outreach Sieve
	{leads.length > 0 && (
	<span className="ml-1.5 bg-emerald-500/10 text-emerald-400 py-0.5 px-2 rounded-full text-xs font-bold font-mono">
	{leads.length}
	</span>
	)}
	</button>
 <button
 onClick={() => setActiveTab('tokens')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
 activeTab === 'tokens' 
 ? 'bg-[#1C1C22] text-white shadow-sm ring-1 ring-black/5' 
 : 'text-gray-300 hover:text-white hover:bg-[#1C1C22]/50 border-[#7C3AED]/20'
 }`}
 >
 <Database className="h-4 w-4" />
 Token Usage
 </button>
 <button
 onClick={() => setActiveTab('errors')}
 className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
 activeTab === 'errors' 
 ? 'bg-[#1C1C22] text-red-600 shadow-sm ring-1 ring-black/5' 
 : 'text-gray-300 hover:text-red-600 hover:bg-[#1C1C22]/50 border-[#7C3AED]/20'
 }`}
 >
 <Bug className="h-4 w-4" />
 Error Logs
 {errorLogs.length > 0 && (
 <span className="ml-1.5 bg-red-500/10 text-red-500 py-0.5 px-2 rounded-full text-xs font-bold">
 {errorLogs.length}
 </span>
 )}
 </button>
 </div>
 </div>

  {activeTab === 'whatsapp' && (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#12121E] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-450">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-sans">Total Leads Ingested</div>
            <div className="text-2xl font-bold text-white">{leads.length}</div>
          </div>
        </div>
        <div className="bg-[#12121E] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-405">
            <Send className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">Outreach Deliveries</div>
            <div className="text-2xl font-bold text-white">
              {leads.filter(l => l.status === 'OUTREACH_SENT').length}
            </div>
          </div>
        </div>
        <div className="bg-[#12121E] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-450">
            <Sparkles className="w-5 h-5 font-bold" />
          </div>
          <div>
            <div className="text-xs text-slate-450 font-sans">Customer Responses</div>
            <div className="text-2xl font-bold text-white font-mono">
              {leads.filter(l => l.status === 'INTERACTED').length}
            </div>
          </div>
        </div>
        <div className="bg-[#12121E] border border-white/5 rounded-2xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-red-400/10 flex items-center justify-center text-red-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-405 font-sans font-medium">Pruned & Deactivated</div>
            <div className="text-2xl font-bold text-white font-mono">
              {leads.filter(l => l.status === 'DEACTIVATED_UNENGAGED').length}
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Map Sieve + Leads List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Scraper / Sieve Simulation */}
        <div className="space-y-6">
          <div className="bg-[#12121E] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 font-display">
              <Zap className="text-emerald-400 w-5 h-5 fill-emerald-400/10" /> Map Sieve & Pipeline Simulator
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Simulate scraping Google Places listings, filter landlines, compress cover images to WebP &lt; 1MB, and save to your Cloud Firestore records.
            </p>

            <div className="space-y-4 font-sans text-xs">
              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5 font-sans">Target Niche</label>
                <select 
                  value={sieveNiche}
                  onChange={(e) => setSieveNiche(e.target.value)}
                  className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#10B981]"
                >
                  <option value="Clinics & Surgical Stores">🏥 Clinics & Surgical Stores</option>
                  <option value="Chemist & Medicos">💊 Chemist Shop</option>
                  <option value="Ayurvedic Wellness">🌿 Ayurvedic Stores</option>
                  <option value="Organic Superfoods">🥗 Organic Groceries</option>
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase text-slate-400 font-semibold mb-1.5 font-sans">Local Address Area</label>
                <input 
                  type="text"
                  value={sieveLocation}
                  onChange={(e) => setSieveLocation(e.target.value)}
                  placeholder="e.g. Lajpat Nagar, Delhi"
                  className="w-full bg-[#1C1C2A] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-[#10B981]"
                />
              </div>

              <button
                onClick={handleRunMapsSieve}
                disabled={runningMapSieve}
                className="w-full py-3 bg-[#10B981] hover:bg-emerald-600 font-bold text-sm text-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
              >
                {runningMapSieve ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Gathering Places API...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Trigger Automated Sieve Scan
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="bg-[#12121E] border border-white/5 rounded-3xl p-6 shadow-xl">
            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2 font-display">
              <ShieldCheck className="text-blue-400 w-5 h-5 animate-pulse" /> TTL Automatic Deactivation
            </h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed font-light font-sans">
              Leads in the collection have a 72-hour TTL (Time-To-Live) window. If the merchant fails to respond within this countdown, their localized creative links are archived to keep storage bloating to a minimum!
            </p>
          </div>
        </div>

        {/* Lead Table List */}
        <div className="lg:col-span-2 bg-[#12121E] border border-white/5 rounded-3xl p-6 overflow-hidden flex flex-col shadow-2xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <h3 className="text-lg font-bold text-white font-display">Discovered Lead Records</h3>
              <p className="text-xs text-slate-405 font-sans">All live data rows stored in Firestore db</p>
            </div>

            {/* Filter */}
            <div className="flex bg-[#1C1C2A] p-0.5 rounded-lg text-xs border border-white/5 overflow-x-auto gap-1">
              {(["ALL", "PENDING_OUTREACH", "OUTREACH_SENT", "INTERACTED"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveLeadFilter(f)}
                  className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap ${
                    activeLeadFilter === f 
                      ? 'bg-[#12121E] text-white shadow-sm ring-1 ring-black/5 font-semibold' 
                      : 'text-slate-405 hover:text-white'
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
              <div className="py-12 text-center border border-dashed border-white/5 rounded-2xl">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-550 mb-2 animate-pulse" />
                <p className="text-sm text-slate-350 font-semibold font-display">No active lead data stored yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 font-light font-sans">Use the left Scan simulator to run a live Google Maps sieve pipeline!</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-slate-200 font-sans">
                <thead>
                  <tr className="border-b border-white/5 text-[11px] font-mono text-slate-400 uppercase">
                    <th className="py-3 px-2">Merchant Name</th>
                    <th className="py-3 px-2">Phone & Address</th>
                    <th className="py-3 px-2">WebP Space ratio</th>
                    <th className="py-3 px-2">Status</th>
                    <th className="py-3 px-2 text-right">Outreach triggers</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {leads
                    .filter(l => activeLeadFilter === 'ALL' ? true : l.status === activeLeadFilter)
                    .map((lead) => {
                      const isUnengaged = lead.status === 'DEACTIVATED_UNENGAGED';
                      return (
                        <tr key={lead.id} className="hover:bg-white/5 transition-colors text-xs font-light">
                          <td className="py-3 px-2 max-w-[140px]">
                            <div className="font-bold text-white truncate">{lead.name}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                              ⭐ {lead.rating} | {lead.photosCount} photos
                            </div>
                          </td>
                          <td className="py-3 px-2 max-w-[170px]">
                            <div className="text-slate-200 font-mono truncate">{lead.phone}</div>
                            <div className="text-[10px] text-slate-405 truncate mt-0.5 leading-snug">{lead.address}</div>
                          </td>
                          <td className="py-3 px-2">
                            {lead.compressedSize && lead.compressedSize !== "N/A" ? (
                              <div>
                                <span className="font-mono text-[#10B981] font-bold">{lead.compressedSize}</span>
                                <div className="text-[9px] text-slate-500 italic font-light">Saved ~91%</div>
                              </div>
                            ) : (
                              <span className="text-amber-500 px-1.5 py-0.5 rounded bg-amber-500/10 text-[10px] font-mono">No Canvas</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <span 
                              onClick={() => handleToggleLeadStatus(lead.id, lead.status)}
                              className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase cursor-pointer select-none transition-all hover:scale-105 active:scale-95 ${
                                lead.status === 'PENDING_OUTREACH' ? 'bg-amber-500/15 text-amber-505 border border-amber-500/25' :
                                lead.status === 'OUTREACH_SENT' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' :
                                lead.status === 'INTERACTED' ? 'bg-[#10B981]/15 text-[#10B981] border border-emerald-500/25' :
                                'bg-slate-500/15 text-slate-400 border border-slate-500/25'
                              }`}
                            >
                              {lead.status.replace("_", " ")}
                            </span>
                            {lead.nextCheckTime && lead.status === 'OUTREACH_SENT' && (
                              <div className="text-[8px] text-slate-500 flex items-center gap-0.5 mt-1 font-mono">
                                <Clock className="w-2.5 h-2.5 text-blue-400" /> 71h TTL
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
                                    ? 'bg-[#10B981] text-black font-semibold' 
                                    : 'bg-[#1C1C2A] hover:bg-white/10 text-slate-200'
                                }`}
                              >
                                {simulatedMessageStatus === 'sending' ? (
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                ) : simulatedMessageStatus === lead.id ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" /> Sent!
                                  </>
                                ) : (
                                  <>
                                    <Smartphone className="w-3 h-3 text-[#10B981]" /> Send Pitch
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteLead(lead.id)}
                                className="p-1.5 bg-red-400/10 hover:bg-red-400/20 text-red-500 rounded-lg transition-colors border border-red-500/10 cursor-pointer"
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
      <div className="bg-[#12121E] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl"></div>
        
        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 font-display">
          <Smartphone className="w-6 h-6 text-[#10B981]" /> Tror WhatsApp Cloud API integration & Setup Manual
        </h2>
        
        <p className="text-sm text-slate-350 max-w-4xl mb-8 leading-relaxed font-light">
          Since all general customer outreach interactions happen over WhatsApp securely, follow this guide to link the Meta Developers suite with our custom active webhook systems.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
          <div className="bg-[#1C1C2A] p-5 rounded-2xl border border-white/5 space-y-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono border border-emerald-400/20">1</div>
            <h4 className="font-bold text-white text-base">Create Meta Developer App</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans font-light">
              Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="text-emerald-400 underline font-semibold">developers.facebook.com</a>, register, create a new <strong>Business Type</strong> application, and enable the <strong>WhatsApp</strong> product.
            </p>
          </div>

          <div className="bg-[#1C1C2A] p-5 rounded-2xl border border-white/5 space-y-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono border border-emerald-400/20">2</div>
            <h4 className="font-bold text-white text-base">Generate Permanent Token</h4>
            <p className="text-xs text-slate-450 leading-relaxed font-light font-sans font-light">
              Avoid temporal test tokens. Go to your Meta Business Manager, create a new <strong>System User</strong>, authorize WhatsApp assets, and grant full <strong>whatsapp_business_messaging</strong> permissions.
            </p>
          </div>

          <div className="bg-[#1C1C2A] p-5 rounded-2xl border border-white/5 space-y-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-emerald-400/10 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono border border-emerald-400/20">3</div>
            <h4 className="font-bold text-white text-base font-semibold">Setup Webhook URL</h4>
            <p className="text-xs text-slate-405 leading-relaxed font-light font-sans font-light">
              In Meta App Dashboard, navigate to WhatsApp - Configuration. Paste your Live URL endpoint: <code className="text-[10px] text-slate-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">https://brandtopost.com/api/whatsapp</code>. Verify using secrets token <strong>TROR_WEBHOOK_SECURE_KEY</strong>.
            </p>
          </div>

          <div className="bg-[#1C1C2A] p-5 rounded-2xl border border-white/5 space-y-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-[#10B910]/10 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono border border-emerald-400/20">4</div>
            <h4 className="font-bold text-white text-base">Subscribe to Event Topics</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light font-sans font-light">
              Choose <strong>messages</strong> and <strong>message_templates</strong> hooks as active subscriptions. This updates the customer response state in real-time when they type any layout letters back!
            </p>
          </div>

          <div className="bg-[#1C1C2A] p-5 rounded-2xl border border-white/5 space-y-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-[#10B910]/10 text-[#10B981] flex items-center justify-center font-bold text-sm font-mono border border-emerald-400/20">5</div>
            <h4 className="font-bold text-white text-base">Build Media Templates</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light font-sans font-light font-sans">
              Submit your story layout templates for approval inside Meta Business Suite. Ensure header parameter utilizes <strong>JPEG/PNG (WebP Optimized)</strong> media formats so creatives load lightning-fast.
            </p>
          </div>

          <div className="bg-[#1C1C2A] p-5 rounded-2xl border border-white/5 space-y-3 shadow-lg">
            <div className="w-8 h-8 rounded-full bg-[#10B910]/10 text-emerald-400 flex items-center justify-center font-bold text-sm font-mono border border-emerald-400/20">6</div>
            <h4 className="font-bold text-white text-base font-semibold">Configure Env Variables</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-light font-sans font-light font-sans font-light">
              Set <code className="text-[10px] text-slate-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">WHATSAPP_TOKEN</code> and <code className="text-[10px] text-slate-300 bg-black/40 px-1.5 py-0.5 rounded font-mono">PHONE_NUMBER_ID</code> inside settings. Your automated robotic assistant is now fully integrated.
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
 <p className="text-sm font-medium text-gray-300">Total API Calls</p>
 <p className="text-2xl font-bold text-white">{logs.length}</p>
 </div>
 </div>
 <div className="glass-card p-6 flex items-center gap-4">
 <div className="h-12 w-12 rounded-full bg-[#7C3AED]/10 flex items-center justify-center">
 <Database className="h-6 w-6 text-purple-600" />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-300">Total Tokens / Images</p>
 <p className="text-lg font-bold text-white">{totalTokens.toLocaleString()} / {totalImages}</p>
 </div>
 </div>
 <div className="glass-card p-6 flex items-center gap-4">
 <div className="h-12 w-12 rounded-full bg-[#18F07A]/10 flex items-center justify-center">
 <DollarSign className="h-6 w-6 text-[#18F07A]" />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-300">Estimated Cost (USD)</p>
 <p className="text-2xl font-bold text-white">${totalEstimatedCostUSD.toFixed(4)}</p>
 </div>
 </div>
 <div className="glass-card p-6 flex items-center gap-4">
 <div className="h-12 w-12 rounded-full bg-[#18F07A]/10 flex items-center justify-center">
 <span className="text-[#18F07A] font-bold text-xl">₹</span>
 </div>
 <div>
 <p className="text-sm font-medium text-gray-300">Estimated Cost (INR)</p>
 <p className="text-2xl font-bold text-white">₹{totalEstimatedCostINR.toFixed(2)}</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Tokens by Operation */}
 <div className="glass-card p-6">
 <h3 className="text-lg font-semibold text-white mb-6">Tokens by Operation</h3>
 <div className="h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={operationChartData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
 <YAxis stroke="#6b7280" fontSize={12} />
 <Tooltip 
 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
 cursor={{fill: 'rgba(0,0,0,0.05)'}}
 />
 <Bar dataKey="value" fill="#ff6347" radius={[4, 4, 0, 0]} name="Tokens" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Tokens by Model */}
 <div className="glass-card p-6">
 <h3 className="text-lg font-semibold text-white mb-6">Cost by Model (USD)</h3>
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
 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
 <Legend />
 </PieChart>
 </ResponsiveContainer>
 </div>
 </div>
 </div>

 {/* Timeline Chart */}
 <div className="glass-card p-6">
 <h3 className="text-lg font-semibold text-white mb-6">Usage Timeline (Tokens)</h3>
 <div className="h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={timelineChartData}>
 <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
 <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
 <YAxis stroke="#6b7280" fontSize={12} />
 <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
 <Line type="monotone" dataKey="tokens" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Tokens" />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>

 {/* Cost & Tokens by Process */}
  <div className="glass-card p-6 overflow-hidden">
    <h3 className="text-lg font-semibold text-white mb-6">Cost & Tokens by Process</h3>
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#7C3AED]/20">
            <th className="py-3 px-4 text-sm font-semibold text-gray-300">Process (Operation)</th>
            <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-center">Run Count</th>
            <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Prompt Tokens</th>
            <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Candidate Tokens</th>
            <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Total Tokens / Img</th>
            <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Total Cost (USD)</th>
            <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Total Cost (INR)</th>
            <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Avg Cost / Run</th>
          </tr>
        </thead>
        <tbody>
          {costBreakdownData.map((row) => (
            <tr key={row.name} className="border-b border-[#7C3AED]/20 hover:bg-[#1C1C22]/50 border-[#7C3AED]/20 transition-colors">
              <td className="py-3 px-4 text-sm text-white font-medium whitespace-nowrap">
                {row.friendlyName}
                <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{row.name}</span>
              </td>
              <td className="py-3 px-4 text-sm text-gray-300 text-center font-mono">
                {row.count}
              </td>
              <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
                {row.name === 'generateImage' || row.name === 'generateOneDayStoryImage' ? '-' : row.promptTokens.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
                {row.name === 'generateImage' || row.name === 'generateOneDayStoryImage' ? '-' : row.candidateTokens.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-sm font-semibold text-white text-right font-mono">
                {row.name === 'generateImage' || row.name === 'generateOneDayStoryImage' 
                  ? `${row.totalTokens} img` 
                  : row.totalTokens.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-sm font-semibold text-[#18F07A] text-right font-mono">
                ${row.totalCostUsd.toFixed(4)}
              </td>
              <td className="py-3 px-4 text-sm font-semibold text-[#18F07A] text-right font-mono">
                ₹{row.totalCostInr.toFixed(2)}
              </td>
              <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
                ${row.averageCostUsd.toFixed(4)} <span className="text-gray-400 text-xs">/ ₹{row.averageCostInr.toFixed(2)}</span>
              </td>
            </tr>
          ))}
          {costBreakdownData.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-gray-300">
                No process logs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>

 {/* Recent Logs Table */}
 <div className="glass-card p-6 overflow-hidden">
 <h3 className="text-lg font-semibold text-white mb-6">Recent API Logs</h3>
 <div className="overflow-x-auto">
 <table className="w-full text-left border-collapse">
 <thead>
 <tr className="border-b border-[#7C3AED]/20">
 <th className="py-3 px-4 text-sm font-semibold text-gray-300">Date & Time</th>
 <th className="py-3 px-4 text-sm font-semibold text-gray-300">Operation</th>
 <th className="py-3 px-4 text-sm font-semibold text-gray-300">Model</th>
 <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Prompt</th>
 <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Candidate</th>
 <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Total</th>
 <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Cost (USD)</th>
 <th className="py-3 px-4 text-sm font-semibold text-gray-300 text-right">Cost (INR)</th>
 </tr>
 </thead>
 <tbody>
 {logs.slice(0, 20).map((log) => {
 let logCost = 0;
 const rates = PRICING[log.model as keyof typeof PRICING] as any;
 if (rates) {
 if (log.model === 'gemini-3.1-flash-image-preview' && rates.perImage) {
 logCost = log.totalTokenCount * rates.perImage;
 } else {
 logCost = (log.promptTokenCount / 1000000) * rates.prompt + (log.candidatesTokenCount / 1000000) * rates.candidate;
 }
 }
 return (
 <tr key={log.id} className="border-b border-[#7C3AED]/20 hover:bg-[#1C1C22]/50 border-[#7C3AED]/20 transition-colors">
 <td className="py-3 px-4 text-sm text-white whitespace-nowrap">
 {new Date(log.timestamp).toLocaleString()}
 </td>
 <td className="py-3 px-4 text-sm text-white font-medium">
 {getFriendlyOperationName(log.operationType)}
 </td>
 <td className="py-3 px-4 text-sm text-gray-300">
 {log.model}
 </td>
 <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
 {log.promptTokenCount.toLocaleString()}
 </td>
 <td className="py-3 px-4 text-sm text-gray-300 text-right font-mono">
 {log.candidatesTokenCount.toLocaleString()}
 </td>
 <td className="py-3 px-4 text-sm font-semibold text-white text-right font-mono">
 {log.model === 'gemini-3.1-flash-image-preview' ? `${log.totalTokenCount} img` : log.totalTokenCount.toLocaleString()}
 </td>
 <td className="py-3 px-4 text-sm font-semibold text-[#18F07A] text-right font-mono">
 ${logCost.toFixed(5)}
 </td>
 <td className="py-3 px-4 text-sm font-semibold text-[#18F07A] text-right font-mono">
 ₹{(logCost * USD_TO_INR).toFixed(3)}
 </td>
 </tr>
 );
 })}
 {logs.length === 0 && (
 <tr>
 <td colSpan={8} className="py-8 text-center text-gray-300">
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
 <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
 <AlertCircle className="h-6 w-6 text-red-600" />
 </div>
 <div>
 <p className="text-sm font-medium text-gray-300">Total Logged Errors</p>
 <p className="text-2xl font-bold text-white">{errorLogs.length}</p>
 </div>
 </div>

 <div className="flex items-center gap-3 bg-[#1C1C22]/50 border-[#7C3AED]/20 p-2 rounded-xl border border-red-100">
 <select 
 value={deleteFilter === null ? "" : deleteFilter}
 onChange={(e) => setDeleteFilter(e.target.value === "" ? null : Number(e.target.value))}
 className="glass-input text-sm py-2 px-3 border-red-500/20 focus:border-red-400 focus:ring-red-400"
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
 className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-full transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
 >
 {isDeleting ? <VideoLoader className="h-7 w-7" /> : <Trash2 className="h-4 w-4" />}
 Delete
 </button>
 </div>
 </div>

 <div className="space-y-4">
 {errorLogs.length === 0 ? (
 <div className="glass-card p-12 text-center">
 <div className="mx-auto h-16 w-16 bg-[#18F07A]/10 rounded-full flex items-center justify-center mb-4">
 <Activity className="h-8 w-8 text-[#18F07A]" />
 </div>
 <h3 className="text-xl font-semibold text-white">All Systems Operational</h3>
 <p className="text-gray-300 mt-2">No errors have been logged recently.</p>
 </div>
 ) : (
 errorLogs.map((log) => (
 <div key={log.id} className="glass-card p-6 border border-red-100 hover:border-red-500/20 transition-colors">
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
 <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
 log.type === 'firestore_error' ? 'bg-orange-500/10 text-orange-400' : 'bg-red-500/10 text-red-500'
 }`}>
 {log.type === 'firestore_error' ? 'Firestore DB' : 'Application'}
 </span>
 <span className="text-sm font-medium text-gray-300">
 {new Date(log.timestamp).toLocaleString()}
 </span>
 </div>
 <h4 className="text-lg font-bold text-white break-all">{log.error}</h4>
 </div>
 </div>
 
 {log.email && (
 <div className="text-sm bg-[#1C1C22]/50 border-[#7C3AED]/20 px-3 py-1.5 rounded-lg border border-[#7C3AED]/20 shrink-0">
 <span className="text-gray-300">User: </span>
 <span className="font-medium text-white">{log.email}</span>
 </div>
 )}
 </div>

 <div className="bg-[#1C1C22]/50 border-[#7C3AED]/20 rounded-xl p-4 text-sm font-mono text-gray-300 overflow-x-auto border border-[#7C3AED]/40">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
 {log.operationType && (
 <div><span className="text-gray-300">Operation:</span> {log.operationType}</div>
 )}
 {log.path && (
 <div><span className="text-gray-300">DB Path:</span> {log.path}</div>
 )}
 {log.url && (
 <div className="col-span-full"><span className="text-gray-300">URL:</span> {log.url}</div>
 )}
 {log.userAgent && (
 <div className="col-span-full"><span className="text-gray-300">User Agent:</span> {log.userAgent}</div>
 )}
 </div>
 
 {log.context && Object.keys(log.context).length > 0 && (
 <div className="mt-4 pt-4 border-t border-[#7C3AED]/20/50">
 <span className="text-gray-300 block mb-1">Context:</span>
 <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(log.context, null, 2)}</pre>
 </div>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 </div>
 )}
 </div>
 );
}
