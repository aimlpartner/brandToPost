import { Clock } from "lucide-react";
import { cn } from "../lib/utils";

interface CustomTimePickerProps {
  value: string; // 24h format "HH:MM" (e.g. "14:30")
  onChange: (time24h: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CustomTimePicker({ value, onChange, disabled = false, className }: CustomTimePickerProps) {
  // Parse value (HH:MM) into 12-hour format parts
  const parseTime = (timeStr: string) => {
    try {
      const parts = (timeStr || "14:00").split(":");
      const h24 = parseInt(parts[0], 10) || 0;
      const m = parseInt(parts[1], 10) || 0;
      const period = h24 >= 12 ? "PM" : "AM";
      let hour12 = h24 % 12;
      if (hour12 === 0) hour12 = 12;
      return { hour12, minute: m, period };
    } catch (e) {
      return { hour12: 12, minute: 0, period: "PM" as const };
    }
  };

  const { hour12, minute, period } = parseTime(value);

  // Convert 12h parts back to 24h "HH:MM"
  const saveTime = (h12: number, m: number, p: string) => {
    let h24 = h12;
    if (p === "PM" && h12 !== 12) {
      h24 += 12;
    } else if (p === "AM" && h12 === 12) {
      h24 = 0;
    }
    const hStr = h24.toString().padStart(2, "0");
    const mStr = m.toString().padStart(2, "0");
    onChange(`${hStr}:${mStr}`);
  };

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={cn("inline-flex items-center gap-1.5 bg-white border border-slate-200/90 shadow-sm rounded-xl p-1", className)}>
      <Clock className="h-3.5 w-3.5 text-violet-600 ml-1.5 shrink-0" />
      
      {/* Hour Select */}
      <select
        disabled={disabled}
        value={hour12}
        onChange={(e) => saveTime(parseInt(e.target.value, 10), minute, period)}
        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors disabled:opacity-50"
      >
        {hoursList.map((h) => (
          <option key={h} value={h}>
            {h.toString().padStart(2, "0")}
          </option>
        ))}
      </select>

      <span className="text-xs font-black text-slate-400 font-mono">:</span>

      {/* Minute Select */}
      <select
        disabled={disabled}
        value={minute}
        onChange={(e) => saveTime(hour12, parseInt(e.target.value, 10), period)}
        className="bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 outline-none cursor-pointer transition-colors disabled:opacity-50"
      >
        {minutesList.map((m) => (
          <option key={m} value={m}>
            {m.toString().padStart(2, "0")}
          </option>
        ))}
      </select>

      {/* AM / PM Toggle Pills */}
      <div className="flex items-center rounded-lg bg-slate-100 p-0.5 border border-slate-200 ml-0.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => saveTime(hour12, minute, "AM")}
          className={cn(
            "px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer",
            period === "AM" ? "bg-violet-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
          )}
        >
          AM
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => saveTime(hour12, minute, "PM")}
          className={cn(
            "px-2 py-0.5 text-[10px] font-extrabold rounded-md transition-all cursor-pointer",
            period === "PM" ? "bg-violet-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800"
          )}
        >
          PM
        </button>
      </div>
    </div>
  );
}
