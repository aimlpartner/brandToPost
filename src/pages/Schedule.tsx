import { useState, useEffect } from "react";
import { Clock, Play, Pause, Trash2, CalendarClock, CheckCircle2 } from "lucide-react";
import { cn, formatCopy } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { logSilentError } from "../lib/firestore-error";

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

  useEffect(() => {
    if (!activeProduct) return;
    
    const fetchSchedule = () => {
      fetch(`/api/schedule?productId=${activeProduct.id}`)
        .then(res => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then(data => {
          setConfig(data.config);
          setQueue(data.queue);
          
          // Convert UTC time to local time for the input
          const [utcHours, utcMinutes] = data.config.timeUtc.split(':');
          const d = new Date();
          d.setUTCHours(parseInt(utcHours, 10));
          d.setUTCMinutes(parseInt(utcMinutes, 10));
          
          const localH = d.getHours().toString().padStart(2, '0');
          const localM = d.getMinutes().toString().padStart(2, '0');
          setLocalTime(`${localH}:${localM}`);
        })
        .catch(err => logSilentError(err as Error, { context: "fetchSchedule" }));
    };

    fetchSchedule();
    
    // Poll every 10 seconds to keep queue updated
    const interval = setInterval(fetchSchedule, 10000);
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
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    const res = await fetch('/api/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !config.enabled, productId: activeProduct.id })
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    setConfig(data.config);
  };

  const handleRemove = async (id: string) => {
    if (!activeProduct) return;
    const res = await fetch(`/api/schedule/queue/${id}?productId=${activeProduct.id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    setQueue(data.queue);
  };

  if (!activeProduct) {
    return <div className="p-8">Please select or create a product first.</div>;
  }

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in duration-500">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[#111827]">Schedule</h1>
        <p className="mt-2 text-sm text-[#ff8566]">
          Automate your Traction. Posts will be published automatically at your selected time.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings Panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass-panel p-6">
            <h3 className="text-base font-semibold text-[#111827] mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-[#ff8566]" />
              Daily Schedule
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#4b5563] mb-2">Posting Time (Local)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="time"
                    value={localTime}
                    onChange={(e) => handleSaveTime(e.target.value)}
                    className="glass-input block w-full py-2 px-3 sm:text-sm"
                  />
                  {isSaving && <CheckCircle2 className="h-5 w-5 text-[#ff6347] animate-pulse" />}
                </div>
              </div>

              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">Automation Status</p>
                    <p className="text-xs text-[#ff8566] mt-0.5">{config.enabled ? 'Active' : 'Paused'}</p>
                  </div>
                  <button
                    onClick={handleToggle}
                    className={cn(
                      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#ff6347] focus:ring-offset-2",
                      config.enabled ? "bg-[#ff6347]" : "bg-black/10"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        config.enabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card p-6">
            <h4 className="text-sm font-semibold text-[#111827] mb-2">How it works</h4>
            <ul className="text-xs text-[#6b7280] space-y-2 list-disc pl-4">
              <li>Add posts to the queue from the Campaigns page.</li>
              <li>The system will publish the top post in the queue every day at your selected time.</li>
              <li>Make sure your LinkedIn account is connected in Settings.</li>
              <li>Pause automation at any time to stop publishing.</li>
            </ul>
          </div>
        </div>

        {/* Queue Panel */}
        <div className="md:col-span-2">
          <div className="glass-panel overflow-hidden flex flex-col h-[600px]">
            <div className="px-6 py-5 border-b border-white/20 bg-white/10 flex items-center justify-between">
              <h3 className="text-base font-semibold text-[#111827] flex items-center gap-2">
                <CalendarClock className="h-5 w-5 text-[#ff6347]" />
                Post Queue
              </h3>
              <span className="inline-flex items-center rounded-full bg-white/40 px-2.5 py-0.5 text-xs font-medium text-[#374151] backdrop-blur-md">
                {queue.length} items
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              {queue.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="h-12 w-12 rounded-full bg-white/40 backdrop-blur-md flex items-center justify-center mb-4">
                    <CalendarClock className="h-6 w-6 text-[#ff8566]" />
                  </div>
                  <h3 className="text-sm font-semibold text-[#111827]">Queue is empty</h3>
                  <p className="mt-1 text-sm text-[#ff8566] max-w-xs">
                    Go to the Campaigns page to add generated posts to your schedule.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {queue.map((item, index) => (
                    <div key={item.id} className="relative glass-card p-5 hover:border-white/50 transition-colors">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/40 backdrop-blur-md text-xs font-medium text-[#6b7280]">
                            {index + 1}
                          </span>
                          <span className="inline-flex items-center rounded-md bg-white/40 px-2 py-1 text-xs font-medium text-blue-800 ring-1 ring-inset ring-white/50 backdrop-blur-md">
                            {item.platform}
                          </span>
                          {item.day && (
                            <span className="inline-flex items-center rounded-md bg-white/40 px-2 py-1 text-xs font-medium text-[#374151] ring-1 ring-inset ring-white/50 backdrop-blur-md">
                              {item.day} {item.date && `(${new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="text-[#ff8566] hover:text-red-500 hover:bg-red-50/50 p-1.5 rounded-lg transition-colors"
                          title="Remove from queue"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-[#4b5563] whitespace-pre-wrap line-clamp-4">{formatCopy(item.text)}</p>
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
