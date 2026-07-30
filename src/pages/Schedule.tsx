import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Clock, Play, Pause, Trash2, CalendarClock, CheckCircle2, Brain, Cpu, Zap, Sparkles, Loader2 } from "lucide-react";
import { cn, formatCopy, localToUtc, utcToLocal } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { logSilentError } from "../lib/firestore-error";
import { auth } from "../firebase";
import { CustomTimePicker } from "../components/CustomTimePicker";

interface QueueItem {
 id: string;
 text: string;
 campaignId: string;
 platform: string;
 productId: string;
 day?: string;
 date?: string;
}

export function Schedule() {
 const { activeProduct } = useProducts();
 const { userProfile } = useAuth();
 const [config, setConfig] = useState({ enabled: false, timeUtc: "14:00" });
 const [queue, setQueue] = useState<QueueItem[]>([]);
 const [localTime, setLocalTime] = useState("09:00");
 const [isSaving, setIsSaving] = useState(false);

  const [autoConfig, setAutoConfig] = useState({
    enabled: false,
    automateDailyPosts: false,
    automateDailyBlogs: false,
    automateWeeklyCampaigns: false,
    automationTimeUtc: "14:00",
    automationWeeklyDay: "Monday",
    requireEmailApproval: true,
    autoUploadDelayHours: 12,
    logs: [] as any[]
  });
  const [autoLocalTime, setAutoLocalTime] = useState("09:00");
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProduct) return;
    
    const fetchData = async (isInitial = false) => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        // Fetch Schedule
        const resSchedule = await fetch(`/api/schedule?productId=${activeProduct.id}`, { headers });
        if (resSchedule.ok) {
          const data = await resSchedule.json();
          setQueue(data.queue);
          
          if (isInitial) {
            setConfig(data.config);
            setLocalTime(utcToLocal(data.config.timeUtc));
          }
        }

        // Fetch Automation Config
        const resAuto = await fetch(`/api/automation/config?productId=${activeProduct.id}`, { headers });
        if (resAuto.ok) {
          const autoData = await resAuto.json();
          
          if (isInitial) {
            setAutoConfig({
              enabled: autoData.enabled,
              automateDailyPosts: autoData.automateDailyPosts || false,
              automateDailyBlogs: autoData.automateDailyBlogs || false,
              automateWeeklyCampaigns: autoData.automateWeeklyCampaigns || false,
              automationTimeUtc: autoData.automationTimeUtc || "14:00",
              automationWeeklyDay: autoData.automationWeeklyDay || "Monday",
              requireEmailApproval: autoData.requireEmailApproval !== false,
              autoUploadDelayHours: autoData.autoUploadDelayHours || 12,
              logs: autoData.logs || []
            });

            setAutoLocalTime(utcToLocal(autoData.automationTimeUtc || "14:00"));
          } else {
            setAutoConfig(prev => ({
              ...prev,
              logs: autoData.logs || []
            }));
          }
        }
      } catch (err) {
        logSilentError(err as Error, { context: "fetchScheduleAndAutomation" });
      }
    };

    fetchData(true);
    const interval = setInterval(() => fetchData(false), 10000);
    return () => clearInterval(interval);
  }, [activeProduct]);

  const handleSaveTime = async (newLocalTime: string) => {
    if (!activeProduct) return;
    setLocalTime(newLocalTime);
    const timeUtc = localToUtc(newLocalTime);
    
    setIsSaving(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ timeUtc, productId: activeProduct.id })
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setConfig(data.config);
    } finally {
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  const handleToggle = async () => {
    if (!activeProduct) return;
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ enabled: !config.enabled, productId: activeProduct.id })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    setConfig(data.config);
  };

  const handleSaveAutoConfig = async (updates: Partial<typeof autoConfig>) => {
    if (!activeProduct) return;
    const newConfig = { ...autoConfig, ...updates };
    // Automatically enable master status if either daily posts or daily blogs or weekly campaigns is active
    newConfig.enabled = newConfig.automateDailyPosts || newConfig.automateDailyBlogs || newConfig.automateWeeklyCampaigns;
    
    const prevConfig = { ...autoConfig };
    setAutoConfig(newConfig);

    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/automation/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId: activeProduct.id,
          enabled: newConfig.enabled,
          automateDailyPosts: newConfig.automateDailyPosts,
          automateDailyBlogs: newConfig.automateDailyBlogs,
          automateWeeklyCampaigns: newConfig.automateWeeklyCampaigns,
          automationTimeUtc: newConfig.automationTimeUtc,
          automationWeeklyDay: newConfig.automationWeeklyDay,
          requireEmailApproval: newConfig.requireEmailApproval,
          autoUploadDelayHours: newConfig.autoUploadDelayHours
        })
      });
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
    } catch (err) {
      logSilentError(err as Error, { context: "handleSaveAutoConfig" });
      setAutoConfig(prevConfig);
    }
  };

  const handleSaveAutoTime = async (newLocalTime: string) => {
    if (!activeProduct) return;
    setAutoLocalTime(newLocalTime);
    const automationTimeUtc = localToUtc(newLocalTime);
    await handleSaveAutoConfig({ automationTimeUtc });
  };

  const handleTriggerAutomation = async () => {
    if (!activeProduct) return;
    setIsTriggering(true);
    setTriggerStatus("Founder Agent is analyzing positioning variables...");
    
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/automation/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ productId: activeProduct.id })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to trigger automation agent");
      }

      setTriggerStatus("Campaign generated successfully! Updating queue...");
      setTimeout(() => {
        setTriggerStatus(null);
        setIsTriggering(false);
      }, 2000);
      
      // Refresh config and queue
      const headers = {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      };
      const resSchedule = await fetch(`/api/schedule?productId=${activeProduct.id}`, { headers });
      if (resSchedule.ok) {
        const data = await resSchedule.json();
        setQueue(data.queue);
      }
      const resAuto = await fetch(`/api/automation/config?productId=${activeProduct.id}`, { headers });
      if (resAuto.ok) {
        const autoData = await resAuto.json();
        setAutoConfig(autoData);
      }
    } catch (err: any) {
      logSilentError(err as Error, { context: "handleTriggerAutomation" });
      setTriggerStatus(`Error: ${err?.message || "Check Founder Agent doppelganger"}`);
      setTimeout(() => setTriggerStatus(null), 5000);
      setIsTriggering(false);
    }
  };

 const handleRemove = async (id: string) => {
 if (!activeProduct) return;
 const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`/api/schedule/queue/${id}?productId=${activeProduct.id}`, { 
      method: 'DELETE',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    });
 if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
 const data = await res.json();
 setQueue(data.queue);
 };

 if (!activeProduct) {
 return <div className="p-8">Please select or create a product first.</div>;
 }

  return (
    <div className="flex flex-col min-h-screen bg-transparent text-slate-800 p-4 md:p-8" id="schedule-container">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6 border-b border-slate-200 pb-6 w-full max-w-7xl mx-auto">
        <div className="tour-schedule-header">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-sans font-semibold text-amber-600 uppercase tracking-wider bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              🚧 Under Construction Zone
            </span>
          </div>
          <h1 className="text-4xl font-display font-light text-slate-900 tracking-tight">
            Schedule & Autopilot Manager
          </h1>
          <p className="text-sm text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Managed by <span className="font-medium text-slate-800">Maya (Autopilot Manager)</span>. Automated background publishing, UTC post queues, and email approval channels.
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white border border-slate-200 py-2.5 px-4 rounded-lg shadow-sm shrink-0">
          <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider">Module Status</span>
            <span className="text-xs font-bold text-slate-800">Under Construction</span>
          </div>
        </div>
      </div>

      {/* Secure Construction Banner Container */}
      <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-950 min-h-[500px] flex flex-col items-center justify-center p-8 md:p-16 text-center space-y-6">
        {/* Subtle Caution Bar Top */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500" />

        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-3xl shadow-xl shadow-amber-500/10">
          🚧
        </div>

        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-sans font-semibold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>🚧 Active Engineering & Construction Zone</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-light font-display text-white tracking-tight leading-tight" style={{ color: '#FFFFFF' }}>
            Autopilot Schedule Is Locked For <br />
            <span className="font-normal italic text-amber-400">System Calibration.</span>
          </h2>

          <p className="text-sm font-light text-slate-200 leading-relaxed max-w-md mx-auto">
            Maya (Autopilot Manager) and the automated posting queue are sealed under maintenance and system upgrades. Direct publishing features are currently paused.
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
    </div>
  );
}
