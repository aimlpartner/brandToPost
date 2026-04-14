import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit, where, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Loader2, ShieldAlert, Activity, Database, DollarSign, Bug, AlertCircle, Trash2 } from 'lucide-react';
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
  'gemini-3.1-pro-preview': { prompt: 1.25, candidate: 5.00 },
  'gemini-3.1-flash-preview': { prompt: 0.075, candidate: 0.30 },
  'gemini-3.1-flash-image-preview': { prompt: 0, candidate: 0, perImage: 0.03 } // $0.03 per image
};

const USD_TO_INR = 83.50; // Exchange rate for INR conversion

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'tokens' | 'errors'>('tokens');
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteFilter, setDeleteFilter] = useState<number | null>(null);

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

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#ff6347]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
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

    // Operation stats (use cost or count, let's stick to count for now but separate images)
    const statValue = log.model === 'gemini-3.1-flash-image-preview' ? log.totalTokenCount : log.totalTokenCount;
    operationStats[log.operationType] = (operationStats[log.operationType] || 0) + statValue;
    
    // Model stats
    modelStats[log.model] = (modelStats[log.model] || 0) + statValue;

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

  const totalEstimatedCostINR = totalEstimatedCostUSD * USD_TO_INR;

  const operationChartData = Object.entries(operationStats).map(([name, value]) => ({ name, value }));
  const modelChartData = Object.entries(modelStats).map(([name, value]) => ({ name, value }));
  const timelineChartData = Object.values(timelineData).reverse(); // Oldest to newest

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#111827] font-display">Admin Dashboard</h1>
          <p className="text-[#6b7280] mt-2">System monitoring and analytics</p>
        </div>
        
        <div className="flex bg-white/50 backdrop-blur-md p-1 rounded-xl ring-1 ring-black/5 w-fit">
          <button
            onClick={() => setActiveTab('tokens')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'tokens' 
                ? 'bg-white text-[#111827] shadow-sm ring-1 ring-black/5' 
                : 'text-[#6b7280] hover:text-[#111827] hover:bg-white/50'
            }`}
          >
            <Database className="h-4 w-4" />
            Token Usage
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'errors' 
                ? 'bg-white text-red-600 shadow-sm ring-1 ring-black/5' 
                : 'text-[#6b7280] hover:text-red-600 hover:bg-white/50'
            }`}
          >
            <Bug className="h-4 w-4" />
            Error Logs
            {errorLogs.length > 0 && (
              <span className="ml-1.5 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                {errorLogs.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeTab === 'tokens' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Activity className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Total API Calls</p>
                <p className="text-2xl font-bold text-[#111827]">{logs.length}</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <Database className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Total Tokens / Images</p>
                <p className="text-lg font-bold text-[#111827]">{totalTokens.toLocaleString()} / {totalImages}</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Estimated Cost (USD)</p>
                <p className="text-2xl font-bold text-[#111827]">${totalEstimatedCostUSD.toFixed(4)}</p>
              </div>
            </div>
            <div className="glass-card p-6 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <span className="text-emerald-600 font-bold text-xl">₹</span>
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Estimated Cost (INR)</p>
                <p className="text-2xl font-bold text-[#111827]">₹{totalEstimatedCostINR.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Tokens by Operation */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-[#111827] mb-6">Tokens by Operation</h3>
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
              <h3 className="text-lg font-semibold text-[#111827] mb-6">Tokens by Model</h3>
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
                      label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
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
            <h3 className="text-lg font-semibold text-[#111827] mb-6">Usage Timeline (Tokens)</h3>
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

          {/* Recent Logs Table */}
          <div className="glass-card p-6 overflow-hidden">
            <h3 className="text-lg font-semibold text-[#111827] mb-6">Recent API Logs</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 px-4 text-sm font-semibold text-[#6b7280]">Date & Time</th>
                    <th className="py-3 px-4 text-sm font-semibold text-[#6b7280]">Operation</th>
                    <th className="py-3 px-4 text-sm font-semibold text-[#6b7280]">Model</th>
                    <th className="py-3 px-4 text-sm font-semibold text-[#6b7280] text-right">Prompt</th>
                    <th className="py-3 px-4 text-sm font-semibold text-[#6b7280] text-right">Candidate</th>
                    <th className="py-3 px-4 text-sm font-semibold text-[#6b7280] text-right">Total</th>
                    <th className="py-3 px-4 text-sm font-semibold text-[#6b7280] text-right">Cost (USD)</th>
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
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-white/40 transition-colors">
                      <td className="py-3 px-4 text-sm text-[#111827] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#111827] font-medium">
                        {log.operationType}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#4b5563]">
                        {log.model}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#4b5563] text-right">
                        {log.promptTokenCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm text-[#4b5563] text-right">
                        {log.candidatesTokenCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-[#111827] text-right">
                        {log.model === 'gemini-3.1-flash-image-preview' ? `${log.totalTokenCount} img` : log.totalTokenCount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">
                        ${logCost.toFixed(5)}
                      </td>
                    </tr>
                    );
                  })}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-[#6b7280]">
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
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#6b7280]">Total Logged Errors</p>
                <p className="text-2xl font-bold text-[#111827]">{errorLogs.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-white/50 p-2 rounded-xl border border-red-100">
              <select 
                value={deleteFilter === null ? "" : deleteFilter}
                onChange={(e) => setDeleteFilter(e.target.value === "" ? null : Number(e.target.value))}
                className="glass-input text-sm py-2 px-3 border-red-200 focus:border-red-400 focus:ring-red-400"
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
                className="glass-button-primary bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {errorLogs.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-[#111827]">All Systems Operational</h3>
                <p className="text-[#6b7280] mt-2">No errors have been logged recently.</p>
              </div>
            ) : (
              errorLogs.map((log) => (
                <div key={log.id} className="glass-card p-6 border border-red-100 hover:border-red-200 transition-colors">
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
                            log.type === 'firestore_error' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {log.type === 'firestore_error' ? 'Firestore DB' : 'Application'}
                          </span>
                          <span className="text-sm font-medium text-[#6b7280]">
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h4 className="text-lg font-bold text-[#111827] break-all">{log.error}</h4>
                      </div>
                    </div>
                    
                    {log.email && (
                      <div className="text-sm bg-white/60 px-3 py-1.5 rounded-lg border border-gray-100 shrink-0">
                        <span className="text-[#6b7280]">User: </span>
                        <span className="font-medium text-[#111827]">{log.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="bg-white/40 rounded-xl p-4 text-sm font-mono text-[#374151] overflow-x-auto border border-white/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                      {log.operationType && (
                        <div><span className="text-[#6b7280]">Operation:</span> {log.operationType}</div>
                      )}
                      {log.path && (
                        <div><span className="text-[#6b7280]">DB Path:</span> {log.path}</div>
                      )}
                      {log.url && (
                        <div className="col-span-full"><span className="text-[#6b7280]">URL:</span> {log.url}</div>
                      )}
                      {log.userAgent && (
                        <div className="col-span-full"><span className="text-[#6b7280]">User Agent:</span> {log.userAgent}</div>
                      )}
                    </div>
                    
                    {log.context && Object.keys(log.context).length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200/50">
                        <span className="text-[#6b7280] block mb-1">Context:</span>
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
