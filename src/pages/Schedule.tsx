import { useState, useEffect } from "react";
import { Clock, Play, Pause, Trash2, CalendarClock, CheckCircle2, Brain, Cpu, Zap, Sparkles, Loader2 } from "lucide-react";
import { cn, formatCopy, localToUtc, utcToLocal } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
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
          automationWeeklyDay: newConfig.automationWeeklyDay
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

  {/* Founder Agent Automation Settings */}
  <div className="glass-panel p-6 shadow-sm border border-slate-200 space-y-6 bg-white/95 text-left rounded-xl relative z-20">
    <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2 font-display">
      <Brain className="h-5 w-5 text-violet-600 font-bold" />
      Founder Agent Automation
    </h3>
    <p className="text-xs text-slate-500 leading-relaxed font-light mb-4">
      Deploy your synthesized Founder Doppelganger to run live topic research, generate campaign themes, and construct weekly drafts automatically.
    </p>

    <div className="space-y-4">
      {!activeProduct.founderAgentSynthesized && (
        <div className="bg-amber-50/90 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-850 flex flex-col gap-2 shadow-sm mb-2 text-left">
          <div className="font-bold flex items-center gap-1.5 text-amber-900">
            <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
            <span>Founder Agent Doppelganger Required</span>
          </div>
          <p className="leading-relaxed text-amber-750 font-light">
            You haven't created your Founder Agent yet. Please first feed and synthesize your Founder Agent Doppelganger on the Product DNA page to activate automated campaigns.
          </p>
          <a
            href="/dashboard/dna"
            className="mt-1 inline-flex items-center justify-center px-3.5 py-2 text-[10px] uppercase tracking-wider font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-[0.98] transition-all rounded-lg w-fit shadow"
          >
            Create Founder Agent
          </a>
        </div>
      )}

      {/* Daily Content Automation */}
      <div className={cn("flex flex-col gap-3 pb-3 border-b border-slate-100", !activeProduct.founderAgentSynthesized && "opacity-60 pointer-events-none")}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Automate Daily Content</p>
            <p className="text-[10px] text-slate-400 font-light mt-0.5">Automatically research and generate content daily</p>
          </div>
          <button
            disabled={!activeProduct.founderAgentSynthesized}
            onClick={() => {
              const isEnabled = autoConfig.automateDailyPosts || autoConfig.automateDailyBlogs;
              if (isEnabled) {
                // Turn off both
                handleSaveAutoConfig({ automateDailyPosts: false, automateDailyBlogs: false });
              } else {
                // Default to Only Posts
                handleSaveAutoConfig({ automateDailyPosts: true, automateDailyBlogs: false });
              }
            }}
            className={cn(
              "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
              (autoConfig.automateDailyPosts || autoConfig.automateDailyBlogs) ? "bg-violet-600" : "bg-slate-200"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out border border-slate-200",
                (autoConfig.automateDailyPosts || autoConfig.automateDailyBlogs) ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>

        {/* If enabled, show the 3 modes */}
        {(autoConfig.automateDailyPosts || autoConfig.automateDailyBlogs) && (
          <div className="mt-2 pl-4 border-l-2 border-violet-100 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Content Type</span>
            <div className="grid grid-cols-1 gap-2">
              {[
                {
                  id: "both",
                  label: "Posts & Blogs/Newsletters",
                  desc: "Generate both matching daily posts and full blogs",
                  posts: true,
                  blogs: true,
                },
                {
                  id: "posts",
                  label: "Only Posts",
                  desc: "Generate and queue only social platform posts",
                  posts: true,
                  blogs: false,
                },
                {
                  id: "blogs",
                  label: "Only Blogs/Newsletters",
                  desc: "Generate and write only deep-dive blogs",
                  posts: false,
                  blogs: true,
                },
              ].map((opt) => {
                const isSelected = autoConfig.automateDailyPosts === opt.posts && autoConfig.automateDailyBlogs === opt.blogs;
                return (
                  <button
                    key={opt.id}
                    disabled={!activeProduct.founderAgentSynthesized}
                    onClick={() => handleSaveAutoConfig({ automateDailyPosts: opt.posts, automateDailyBlogs: opt.blogs })}
                    className={cn(
                      "flex flex-col items-start text-left p-3 rounded-xl border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
                      isSelected
                        ? "bg-violet-50/50 border-violet-200 text-violet-900 shadow-sm"
                        : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50/60 hover:border-slate-300"
                    )}
                  >
                    <span className="text-xs font-semibold">{opt.label}</span>
                    <span className="text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Weekly Campaigns toggle */}
      <div className={cn("flex items-center justify-between pb-3", !activeProduct.founderAgentSynthesized && "opacity-60 pointer-events-none")}>
        <div>
          <p className="text-sm font-semibold text-slate-800">Automate Weekly Campaigns</p>
          <p className="text-[10px] text-slate-400 font-light mt-0.5">Generate weekly campaign drafts in background</p>
        </div>
        <button
          disabled={!activeProduct.founderAgentSynthesized}
          onClick={() => handleSaveAutoConfig({ automateWeeklyCampaigns: !autoConfig.automateWeeklyCampaigns })}
          className={cn(
            "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
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

      {/* Time & Day Selection for Automation Creation */}
      {autoConfig.enabled && (
        <div className={cn("pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200", !activeProduct.founderAgentSynthesized && "opacity-60 pointer-events-none")}>
          <div>
            <label className="block text-xs font-semibold text-slate-750 mb-1.5">Automation Generation Time (Local)</label>
            <CustomTimePicker
              disabled={!activeProduct.founderAgentSynthesized}
              value={autoLocalTime}
              onChange={handleSaveAutoTime}
            />
          </div>

          {autoConfig.automateWeeklyCampaigns && (
            <div>
              <label className="block text-xs font-semibold text-slate-755 mb-1.5">Weekly Automation Day</label>
              <select
                disabled={!activeProduct.founderAgentSynthesized}
                value={autoConfig.automationWeeklyDay}
                onChange={(e) => handleSaveAutoConfig({ automationWeeklyDay: e.target.value })}
                className="glass-input block w-full py-2 px-3 text-xs border border-slate-200 rounded-lg text-slate-800 bg-white shadow-inner focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Manual Trigger Button */}
      <div className="pt-2 border-t border-slate-200 space-y-3">
        <button
          type="button"
          onClick={handleTriggerAutomation}
          disabled={isTriggering || !activeProduct.founderAgentSynthesized}
          className="w-full glass-button-primary rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-750 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div className="glass-panel overflow-hidden flex flex-col h-[480px] border border-slate-200 shadow-sm">
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

    {/* Doppelganger Operations Log */}
    <div className="glass-panel p-6 border border-slate-200 shadow-sm rounded-xl bg-slate-900 text-slate-100 font-mono flex flex-col h-[280px]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", autoConfig.enabled ? "bg-emerald-400" : "bg-amber-400")} />
            <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", autoConfig.enabled ? "bg-emerald-500" : "bg-amber-500")} />
          </span>
          <h3 className="text-xs font-semibold tracking-wider text-slate-200 uppercase">Doppelganger Operations Log</h3>
        </div>
        <span className="text-[10px] text-slate-500">SYSTEM ACTIVE</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-2">
        {autoConfig.logs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center text-xs text-slate-500 font-light">
            No logs found. Enable daily/weekly automation or trigger the agent manually to begin audit tracking.
          </div>
        ) : (
          autoConfig.logs.map((log: any, idx: number) => {
            const isSuccess = log.status === 'Success';
            const logDate = new Date(log.timestamp).toLocaleString();
            return (
              <div key={idx} className="text-xs border-b border-slate-800/40 pb-2.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 font-bold uppercase">
                      {log.type === 'weekly_campaign' ? 'Weekly Campaign' : 'Daily Content'}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-bold uppercase",
                      isSuccess ? "bg-emerald-950/60 text-emerald-400 border border-emerald-900/50" : "bg-red-950/60 text-red-400 border border-red-900/50"
                    )}>
                      {log.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">{logDate}</span>
                </div>
                <div className="text-slate-300 font-light leading-relaxed">
                  <span className="text-violet-400 font-medium mr-1.5">Focus:</span>{log.focus}
                  {log.theme && log.theme !== 'N/A' && (
                    <>
                      <span className="text-slate-500 mx-2">|</span>
                      <span className="text-violet-400 font-medium mr-1.5">Theme:</span>{log.theme}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  </div>
</div>
</div>
);
}
