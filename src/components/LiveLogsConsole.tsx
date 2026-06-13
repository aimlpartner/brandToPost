import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  X, 
  Copy, 
  Download, 
  Trash2, 
  Search, 
  SlidersHorizontal, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Bug,
  Pause,
  Play
} from "lucide-react";
import { loggerService, LogEntry } from "../services/loggerService";

interface LiveLogsConsoleProps {
  onClose?: () => void;
  defaultSectionFilter?: LogEntry["section"] | "all";
  title?: string;
}

export const LiveLogsConsole: React.FC<LiveLogsConsoleProps> = ({ 
  onClose, 
  defaultSectionFilter = "all",
  title = "System Pipeline Live Logs" 
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sectionFilter, setSectionFilter] = useState<LogEntry["section"] | "all">(defaultSectionFilter);
  const [levelFilter, setLevelFilter] = useState<LogEntry["level"] | "all" | "errors-only">("all");
  const [autoscroll, setAutoscroll] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to reactive Logger Service
  useEffect(() => {
    const unsubscribe = loggerService.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  // Handle Autoscroll to bottom for new incoming logs
  useEffect(() => {
    if (autoscroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0; // Since unshifted is newest first, or if we render reversed
    }
  }, [logs, autoscroll]);

  // Filter computation
  const filteredLogs = logs.filter((log) => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) || 
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSection = sectionFilter === "all" || log.section === sectionFilter;
    
    let matchesLevel = true;
    if (levelFilter === "errors-only") {
      matchesLevel = log.level === "error" || log.level === "warn";
    } else if (levelFilter !== "all") {
      matchesLevel = log.level === levelFilter;
    }

    return matchesSearch && matchesSection && matchesLevel;
  });

  const handleCopyLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.section.toUpperCase()}] [${l.level.toUpperCase()}] ${l.message} ${l.details ? `\nDetails: ${l.details}` : ""}`)
      .join("\n");
    
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadLogs = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.section.toUpperCase()}] [${l.level.toUpperCase()}] ${l.message} ${l.details ? `\nDetails: ${l.details}` : ""}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `brand-to-post-generation-logs-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    loggerService.clear();
  };

  // Helper styles based on levels
  const getLevelBadgeStyles = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return "bg-emerald-950/40 text-emerald-400 border border-emerald-500/25";
      case "error":
        return "bg-rose-950/40 text-rose-400 border border-rose-500/30 font-bold animate-pulse";
      case "warn":
        return "bg-amber-950/40 text-amber-400 border border-amber-500/25";
      case "info":
      default:
        return "bg-slate-950/40 text-slate-300 border border-slate-500/20";
    }
  };

  const getLogIcon = (level: LogEntry["level"]) => {
    switch (level) {
      case "success":
        return <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0" />;
      case "error":
        return <AlertTriangle className="h-4.5 w-4.5 text-rose-400 shrink-0" />;
      case "warn":
        return <AlertTriangle className="h-4.5 w-4.5 text-amber-400 shrink-0" />;
      case "info":
      default:
        return <Info className="h-4.5 w-4.5 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0f1d] border border-slate-800 text-slate-100 rounded-xl overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#11192e] border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-indigo-400" />
          <span className="font-mono text-sm font-semibold tracking-wide text-slate-100">{title}</span>
          {logs.some((l) => l.level === "error") && (
            <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-wider bg-rose-500 text-white animate-bounce-subtle">
              Issues Logged
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setAutoscroll(!autoscroll)}
            title={autoscroll ? "Pause Autoscroll" : "Enable Autoscroll"}
            className={`p-1.5 rounded-lg border transition-colors ${
              autoscroll 
                ? "bg-slate-800 border-slate-700 text-indigo-400" 
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300"
            }`}
          >
            {autoscroll ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={handleCopyLogs}
            disabled={filteredLogs.length === 0}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Copy Filtered Logs"
          >
            <Copy className={`h-3.5 w-3.5 ${isCopied ? "text-emerald-400" : ""}`} />
          </button>
          <button
            onClick={handleDownloadLogs}
            disabled={filteredLogs.length === 0}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Download Logs"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-rose-950 bg-slate-900 hover:bg-rose-950/35 text-slate-400 hover:text-rose-400 transition-colors"
            title="Clear Console Buffers"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
              title="Hide Console"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and settings bar */}
      <div className="p-3 bg-[#0d1428] border-b border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Search Input */}
        <div className="relative w-full md:w-56 shrink-0">
          <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <Search className="h-3.5 w-3.5 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search details/logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs tracking-wide text-slate-300 placeholder-slate-500 focus:outline-none focus:border-indigo-500/80 transition-colors"
          />
        </div>

        {/* Level and Section Selectors */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
          {/* Section Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] tracking-wider uppercase font-mono text-slate-500">Pipe:</span>
            <select
              value={sectionFilter}
              onChange={(e) => setSectionFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-[11px] font-mono rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500/80 transition-all cursor-pointer"
            >
              <option value="all">ALL STAGES</option>
              <option value="campaign">CAMPAIGNS</option>
              <option value="image">IMAGEN / MULTIMODAL</option>
              <option value="overlay">PUPPETEER OVERLAY</option>
              <option value="whatsapp">WHATSAPP / CHAT</option>
              <option value="system">SYSTEM CONSOLE</option>
            </select>
          </div>

          {/* Level Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] tracking-wider uppercase font-mono text-slate-500">Level:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-[11px] font-mono rounded-lg px-2 py-1 text-slate-300 focus:outline-none focus:border-indigo-500/80 transition-all cursor-pointer"
            >
              <option value="all">ALL LEVELS</option>
              <option value="errors-only">🔴 ERRORS & WARNS</option>
              <option value="error">🔴 ERROR ONLY</option>
              <option value="warn">🟡 WARN ONLY</option>
              <option value="success">🟢 SUCCESS ONLY</option>
              <option value="info">🔵 INFO ONLY</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs print area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2.5 font-mono text-[11px] leading-relaxed select-text"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-2 h-full">
            <Bug className="h-7 w-7 opacity-30 text-slate-400 rotate-12" />
            <span className="font-mono text-xs tracking-wider">No corresponding log lines discovered.</span>
            <span className="text-[10px] opacity-75">Initiate a post or image generation to stream active processes.</span>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div 
              key={log.id} 
              className={`p-2.5 rounded-lg border bg-[#0b101e] transition-all duration-150 hover:bg-[#0e162b] ${
                log.level === 'error' ? 'border-rose-950/80 bg-rose-950/10' :
                log.level === 'warn' ? 'border-amber-950/60 bg-amber-950/5' :
                'border-slate-800/60'
              }`}
            >
              {/* Header metadata row */}
              <div className="flex flex-wrap items-center justify-between gap-1 mb-1 bg-slate-950/50 py-1 px-1.5 rounded">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {getLogIcon(log.level)}
                  <span className={`px-1.5 py-0.5 rounded text-[9px] uppercase font-bold font-mono tracking-wider ${getLevelBadgeStyles(log.level)}`}>
                    {log.level}
                  </span>
                  <span className="bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded text-[9px] tracking-wide font-semibold uppercase">
                    {log.section}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono italic">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}.{(new Date(log.timestamp).getMilliseconds() + "").padStart(3, "0")}
                </div>
              </div>

              {/* Message body */}
              <div className="text-slate-200 font-extrabold whitespace-pre-wrap pl-1 tracking-wide">
                {log.message}
              </div>

              {/* Collapsible/Extended details element */}
              {log.details && (
                <div className="mt-2 p-2 bg-slate-950/80 border border-slate-800/80 rounded font-mono text-[10px] text-slate-400 whitespace-pre-wrap overflow-x-auto select-all max-h-52 leading-normal italic">
                  {log.details}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer statistics bar */}
      <div className="px-4 py-2 bg-[#0e1529] border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>Active Monitor: <strong className="text-indigo-400">Live</strong></span>
          <span>Buffer: <strong className="text-indigo-400">{logs.length} / 300</strong></span>
        </div>
        <div>
          <span>Showing: <strong className="text-indigo-300">{filteredLogs.length}</strong> lines</span>
        </div>
      </div>
    </div>
  );
};
