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

      {/* Full Blur Overlay Banner Container */}
      <div className="relative w-full max-w-7xl mx-auto rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-white min-h-[600px]">
        
        {/* Full-Coverage Frosted Glass Blur Overlay */}
        <div className="absolute inset-0 z-50 backdrop-blur-xl bg-slate-950/65 flex flex-col items-center justify-start pt-16 md:pt-24 pb-16 px-8 text-center space-y-5">
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

        {/* Blurred Content Behind */}
        <div className="p-8 opacity-30 pointer-events-none filter blur-md">

 <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
 {/* Settings Panel */}
 <div className="md:col-span-1 space-y-6">
 <div className="glass-panel p-6 shadow-sm border border-slate-200 relative z-30">
 <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
 <Clock className="h-5 w-5 text-slate-400" />
 Daily Schedule
 </h3>
 
 <div className="space-y-6">
  <div>
  <label className="block text-sm font-semibold text-slate-700 mb-2">Posting Time (Local)</label>
  <div className="flex items-center gap-3">
  <CustomTimePicker
  value={localTime}
  onChange={handleSaveTime}
  className="tour-posting-time-input"
  />
  {isSaving && <CheckCircle2 className="h-5 w-5 text-[#7C3AED] animate-pulse flex-shrink-0" />}
  </div>
  </div>

 <div className="pt-4 border-t border-slate-200">
 <div className="flex items-center justify-between">
 <div>
 <p className="text-sm font-semibold text-slate-800">Automation Status</p>
 <p className="text-xs text-slate-500 mt-0.5">{config.enabled ? 'Active' : 'Paused'}</p>
 </div>
 <button
 onClick={handleToggle}
 className={cn(
 "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#7C3AED] focus:ring-offset-2",
 config.enabled ? "bg-[#7C3AED]" : "bg-slate-200"
 )}
 >
 <span
 className={cn(
 "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-slate-200",
 config.enabled ? "translate-x-5" : "translate-x-0"
 )}
 />
 </button>
 </div>
 </div>
 </div>
 </div>


 <div className="glass-card p-6 bg-white border border-slate-200 shadow-sm rounded-xl relative z-10">
 <h4 className="text-sm font-semibold text-slate-800 mb-2">How it works</h4>
 <ul className="text-xs text-slate-500 space-y-2 list-disc pl-4 leading-relaxed font-light">
 <li>Add posts to the queue from the Campaigns page.</li>
 <li>The system will publish the top post in the queue every day at your selected time.</li>
 <li>Make sure your LinkedIn account is connected in Settings.</li>
 <li>Pause automation at any time to stop publishing.</li>
 </ul>
 </div>
 </div>

  {/* Queue Panel */}
  <div className="md:col-span-3 space-y-6">
    <div className="glass-panel overflow-hidden flex flex-col min-h-[585px] border border-slate-200 shadow-sm">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 font-display">
          <CalendarClock className="h-5 w-5 text-[#7C3AED]" />
          Post Queue
        </h3>
        <span className="inline-flex items-center rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 ">
          {queue.length} items
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-white/45">
        {queue.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-slate-50 border border-slate-200/60 flex items-center justify-center mb-4">
              <CalendarClock className="h-6 w-6 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 font-display">Queue is empty</h3>
            <p className="mt-1 text-sm text-slate-500 max-w-xs font-light">
              Go to the Campaigns page to add generated posts to your schedule.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((item, index) => (
              <div key={item.id} className="relative glass-card p-5 bg-white border border-slate-200/80 hover:border-[#7C3AED]/35 transition-colors shadow-sm rounded-xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-600">
                      {index + 1}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-[#1C1C22]/50 border-[#7C3AED]/20 px-2 py-1 text-xs font-medium text-gray-300 ring-1 ring-inset ring-white/50 ">
                      {item.platform}
                    </span>
                    {item.day && (
                      <span className="inline-flex items-center rounded-md bg-[#1C1C22]/50 border-[#7C3AED]/20 px-2 py-1 text-xs font-medium text-gray-300 ring-1 ring-inset ring-white/50 ">
                        {item.day} {item.date && `(${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                    title="Remove from queue"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-sm text-slate-600 whitespace-pre-wrap line-clamp-4 leading-relaxed font-light">{formatCopy(item.text)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
</div>
</div>
</div>
</div>
);
}
