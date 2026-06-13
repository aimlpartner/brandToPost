import { useState, useEffect } from "react";
import { Clock, Play, Pause, Trash2, CalendarClock, CheckCircle2, Brain, Cpu, Zap, Sparkles, Loader2 } from "lucide-react";
import { cn, formatCopy } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { logSilentError } from "../lib/firestore-error";
import { auth } from "../firebase";

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
 const [config, setConfig] = useState({ enabled: false, timeUtc: "14:00" });
 const [queue, setQueue] = useState<QueueItem[]>([]);
 const [localTime, setLocalTime] = useState("09:00");
 const [isSaving, setIsSaving] = useState(false);

 const [autoConfig, setAutoConfig] = useState({
   enabled: false,
   automateDailyPosts: false,
   automateWeeklyCampaigns: false,
   logs: [] as any[]
 });
 const [isTriggering, setIsTriggering] = useState(false);
 const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!activeProduct) return;
    
    const fetchData = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const headers = {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        // Fetch Schedule
        const resSchedule = await fetch(`/api/schedule?productId=${activeProduct.id}`, { headers });
        if (resSchedule.ok) {
          const data = await resSchedule.json();
          setConfig(data.config);
          setQueue(data.queue);
          
          const [utcHours, utcMinutes] = data.config.timeUtc.split(':');
          const d = new Date();
          d.setUTCHours(parseInt(utcHours, 10));
          d.setUTCMinutes(parseInt(utcMinutes, 10));
          const localH = d.getHours().toString().padStart(2, '0');
          const localM = d.getMinutes().toString().padStart(2, '0');
          setLocalTime(`${localH}:${localM}`);
        }

        // Fetch Automation Config
        const resAuto = await fetch(`/api/automation/config?productId=${activeProduct.id}`, { headers });
        if (resAuto.ok) {
          const autoData = await resAuto.json();
          setAutoConfig(autoData);
        }
      } catch (err) {
        logSilentError(err as Error, { context: "fetchScheduleAndAutomation" });
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [activeProduct]);

  const handleSaveTime = async (newLocalTime: string) => {
    if (!activeProduct) return;
    setLocalTime(newLocalTime);
    const [localH, localM] = newLocalTime.split(':');
    const d = new Date();
    d.setHours(parseInt(localH, 10));
    d.setMinutes(parseInt(localM, 10));
    
    const utcHours = d.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = d.getUTCMinutes().toString().padStart(2, '0');
    const timeUtc = `${utcHours}:${utcMinutes}`;
    
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
    // Automatically enable master status if either daily posts or weekly campaigns is active
    newConfig.enabled = newConfig.automateDailyPosts || newConfig.automateWeeklyCampaigns;
    setAutoConfig(newConfig);

    try {
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/automation/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          productId: activeProduct.id,
          enabled: newConfig.enabled,
          automateDailyPosts: newConfig.automateDailyPosts,
          automateWeeklyCampaigns: newConfig.automateWeeklyCampaigns
        })
      });
    } catch (err) {
      logSilentError(err as Error, { context: "handleSaveAutoConfig" });
    }
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
 <div className="space-y-8 w-full max-w-screen-2xl animate-in fade-in duration-500">
 <div className="tour-schedule-header">
 <h1 className="text-4xl font-bold tracking-tight text-slate-800 font-display">Schedule</h1>
 <p className="mt-2 text-sm text-slate-500 font-light">
 Automate your Traction. Posts will be published automatically at your selected time.
 </p>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
 {/* Settings Panel */}
 <div className="md:col-span-1 space-y-6">
 <div className="glass-panel p-6 shadow-sm border border-slate-200">
 <h3 className="text-base font-semibold text-slate-800 mb-4 flex items-center gap-2">
 <Clock className="h-5 w-5 text-slate-400" />
 Daily Schedule
 </h3>
 
 <div className="space-y-6">
 <div>
 <label className="block text-sm font-semibold text-slate-700 mb-2">Posting Time (Local)</label>
 <div className="flex items-center gap-3">
 <input
 type="time"
 value={localTime}
 onChange={(e) => handleSaveTime(e.target.value)}
 className="tour-posting-time-input glass-input block w-full py-2 px-3 sm:text-sm border border-slate-200 rounded-lg text-slate-800 bg-white shadow-inner"
 />
 {isSaving && <CheckCircle2 className="h-5 w-5 text-[#7C3AED] animate-pulse" />}
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

  {/* Founder Agent Automation Settings */}
  <div className="glass-panel p-6 shadow-sm border border-slate-200 space-y-6 bg-gradient-to-br from-white/80 to-violet-50/10 text-left rounded-xl">
    <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2 font-display">
      <Brain className="h-5 w-5 text-violet-600 font-bold" />
      Founder Agent Automation
    </h3>
    <p className="text-xs text-slate-500 leading-relaxed font-light mb-4">
      Deploy your synthesized Founder Doppelganger to run live topic research, generate campaign themes, and construct weekly drafts automatically.
    </p>

    <div className="space-y-4">
      {/* Daily Posts toggle */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <p className="text-sm font-semibold text-slate-800">Automate Daily Posts</p>
          <p className="text-[10px] text-slate-400 font-light mt-0.5">Automatically queue daily platform posts</p>
        </div>
        <button
          onClick={() => handleSaveAutoConfig({ automateDailyPosts: !autoConfig.automateDailyPosts })}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            autoConfig.automateDailyPosts ? "bg-violet-600" : "bg-slate-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-slate-200",
              autoConfig.automateDailyPosts ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Weekly Campaigns toggle */}
      <div className="flex items-center justify-between pb-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">Automate Weekly Campaigns</p>
          <p className="text-[10px] text-slate-400 font-light mt-0.5">Generate weekly campaign drafts in background</p>
        </div>
        <button
          onClick={() => handleSaveAutoConfig({ automateWeeklyCampaigns: !autoConfig.automateWeeklyCampaigns })}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
            autoConfig.automateWeeklyCampaigns ? "bg-violet-600" : "bg-slate-200"
          )}
        >
          <span
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-slate-200",
              autoConfig.automateWeeklyCampaigns ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>

      {/* Manual Trigger Button */}
      <div className="pt-2 border-t border-slate-200 space-y-3">
        <button
          type="button"
          onClick={handleTriggerAutomation}
          disabled={isTriggering}
          className="w-full glass-button-primary rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-750 text-white shadow-md disabled:opacity-50"
        >
          {isTriggering ? (
            <>
              <Loader2 className="animate-spin h-3.5 w-3.5" />
              <span>Running Agent...</span>
            </>
          ) : (
            <>
              <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
              <span>Trigger Agent Run Now</span>
            </>
          )}
        </button>
        
        {triggerStatus && (
          <p className="text-[10px] font-medium font-mono text-violet-600 bg-violet-50 p-2 rounded-lg border border-violet-100 text-center animate-pulse">
            {triggerStatus}
          </p>
        )}
      </div>
    </div>
  </div>

 <div className="glass-card p-6 bg-white border border-slate-200 shadow-sm rounded-xl">
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
 <div className="md:col-span-3">
 <div className="glass-panel overflow-hidden flex flex-col h-[600px] border border-slate-200 shadow-sm">
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
 );
}
