import { useState, useEffect, useRef } from "react";
import { Clock, ChevronUp, ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

interface CustomTimePickerProps {
  value: string; // 24h format "HH:MM" (e.g. "14:30")
  onChange: (time24h: string) => void;
  disabled?: boolean;
  className?: string;
}

export function CustomTimePicker({ value, onChange, disabled = false, className }: CustomTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const periodRef = useRef<HTMLDivElement>(null);

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

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Center selected item in scroll container when opening
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        [hourRef, minuteRef, periodRef].forEach((ref) => {
          if (ref.current) {
            const activeItem = ref.current.querySelector('[data-active="true"]');
            if (activeItem) {
              const parent = ref.current;
              const parentHeight = parent.clientHeight;
              const itemTop = (activeItem as HTMLElement).offsetTop;
              const itemHeight = (activeItem as HTMLElement).clientHeight;
              
              // Scroll so item is centered in the viewport
              parent.scrollTop = itemTop - (parentHeight / 2) + (itemHeight / 2);
            }
          }
        });
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const hoursList = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutesList = Array.from({ length: 60 }, (_, i) => i);
  const periodsList = ["AM", "PM"];

  const formattedTime = `${hour12.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} ${period}`;

  const handleHourSelect = (h: number) => {
    saveTime(h, minute, period);
  };

  const handleMinuteSelect = (m: number) => {
    saveTime(hour12, m, period);
  };

  const handlePeriodSelect = (p: string) => {
    saveTime(hour12, minute, p);
  };

  // Fine tune minutes by 1
  const adjustMinute = (amount: number) => {
    let nextMinute = minute + amount;
    if (nextMinute >= 60) nextMinute = 0;
    if (nextMinute < 0) nextMinute = 59;
    saveTime(hour12, nextMinute, period);
  };

  return (
    <div ref={containerRef} className={cn("relative inline-block w-full select-none", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg shadow-sm hover:border-[#7C3AED]/40 hover:shadow transition-all duration-200 cursor-pointer text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed",
          isOpen && "ring-2 ring-violet-500/10 border-violet-500"
        )}
      >
        <span className="font-mono tracking-wider font-medium text-slate-700">
          {formattedTime}
        </span>
        <Clock className={cn("h-4 w-4 text-slate-400 transition-transform duration-300", isOpen && "rotate-12 text-violet-600")} />
      </button>

      {/* Popover picker */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-slate-200/80 shadow-2xl rounded-xl p-4 z-[999] animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col gap-3.5">
          {/* Popover Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Select Time
            </span>
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-150 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => adjustMinute(-1)}
                className="p-1 text-slate-500 hover:text-violet-600 hover:bg-white rounded transition-colors active:scale-95"
                title="Subtract 1 minute"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono font-bold text-slate-600 px-1">
                Fine-tune
              </span>
              <button
                type="button"
                onClick={() => adjustMinute(1)}
                className="p-1 text-slate-500 hover:text-violet-600 hover:bg-white rounded transition-colors active:scale-95"
                title="Add 1 minute"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Three-Column Scroll Wheels */}
          <div className="relative flex items-center justify-between h-48 bg-slate-50/50 border border-slate-150 rounded-xl overflow-hidden px-1">
            {/* Horizontal selection indicator highlight overlay */}
            <div className="absolute top-[80px] left-1.5 right-1.5 h-9 bg-violet-600/10 border-y border-violet-500/20 rounded-lg pointer-events-none" />

            {/* Hour Picker Column */}
            <div
              ref={hourRef}
              className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar text-center py-20"
            >
              {hoursList.map((h) => {
                const isActive = h === hour12;
                return (
                  <div
                    key={h}
                    data-active={isActive}
                    onClick={() => handleHourSelect(h)}
                    className={cn(
                      "h-9 flex items-center justify-center text-sm font-mono cursor-pointer transition-all duration-200 snap-center rounded-lg mx-1",
                      isActive
                        ? "text-violet-700 font-bold text-base scale-110"
                        : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    {h.toString().padStart(2, "0")}
                  </div>
                );
              })}
            </div>

            {/* Minute Picker Column */}
            <div
              ref={minuteRef}
              className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar text-center py-20 border-x border-slate-200/50"
            >
              {minutesList.map((m) => {
                const isActive = m === minute;
                const isStepOf5 = m % 5 === 0;
                return (
                  <div
                    key={m}
                    data-active={isActive}
                    onClick={() => handleMinuteSelect(m)}
                    className={cn(
                      "h-9 flex items-center justify-center text-sm font-mono cursor-pointer transition-all duration-200 snap-center rounded-lg mx-1",
                      isActive
                        ? "text-violet-700 font-bold text-base scale-110"
                        : isStepOf5
                        ? "text-slate-400 hover:text-slate-700"
                        : "text-slate-300 hover:text-slate-600 text-xs"
                    )}
                  >
                    {m.toString().padStart(2, "0")}
                  </div>
                );
              })}
            </div>

            {/* Period Picker Column */}
            <div
              ref={periodRef}
              className="flex-1 h-full overflow-y-auto scroll-smooth snap-y snap-mandatory hide-scrollbar text-center py-20"
            >
              {periodsList.map((p) => {
                const isActive = p === period;
                return (
                  <div
                    key={p}
                    data-active={isActive}
                    onClick={() => handlePeriodSelect(p)}
                    className={cn(
                      "h-9 flex items-center justify-center text-sm font-semibold tracking-wider cursor-pointer transition-all duration-200 snap-center rounded-lg mx-1",
                      isActive
                        ? "text-violet-700 font-bold text-base scale-110"
                        : "text-slate-400 hover:text-slate-700"
                    )}
                  >
                    {p}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Popover Footer */}
          <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 font-light">
            <span className="font-mono">
              Local: {formattedTime}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-lg shadow-sm hover:shadow active:scale-95 transition-all duration-150 cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
