import { useState, useEffect, useCallback, useRef } from "react";

export const DEFAULT_SIDEBAR_WIDTH = 220;
export const MIN_SIDEBAR_WIDTH = 200;
export const MAX_SIDEBAR_WIDTH = 320;
export const SIDEBAR_STORAGE_KEY = "b2p_sidebar_width";

export function useResizableSidebar(
  defaultWidth = DEFAULT_SIDEBAR_WIDTH,
  minWidth = MIN_SIDEBAR_WIDTH,
  maxWidth = MAX_SIDEBAR_WIDTH,
  storageKey = SIDEBAR_STORAGE_KEY
) {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = Number(saved);
        if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return defaultWidth;
  });

  const [isResizing, setIsResizing] = useState(false);
  const widthRef = useRef(width);
  widthRef.current = width;

  const startResizing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const resetWidth = useCallback(() => {
    setWidth(defaultWidth);
    try {
      localStorage.setItem(storageKey, defaultWidth.toString());
    } catch {
      // ignore
    }
  }, [defaultWidth, storageKey]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      let nextWidth = width;
      if (e.key === "ArrowLeft") {
        nextWidth = Math.max(minWidth, width - 10);
      } else if (e.key === "ArrowRight") {
        nextWidth = Math.min(maxWidth, width + 10);
      } else if (e.key === "Home") {
        nextWidth = minWidth;
      } else if (e.key === "End") {
        nextWidth = maxWidth;
      } else if (e.key === "Enter" || e.key === " ") {
        nextWidth = defaultWidth;
      } else {
        return;
      }
      e.preventDefault();
      setWidth(nextWidth);
      try {
        localStorage.setItem(storageKey, nextWidth.toString());
      } catch {
        // ignore
      }
    },
    [width, minWidth, maxWidth, defaultWidth, storageKey]
  );

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = Math.min(Math.max(e.clientX - rect.left, minWidth), maxWidth);
      setWidth(Math.round(newWidth));
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!sidebarRef.current || !e.touches[0]) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      const newWidth = Math.min(Math.max(e.touches[0].clientX - rect.left, minWidth), maxWidth);
      setWidth(Math.round(newWidth));
    };

    const handleEnd = () => {
      setIsResizing(false);
      try {
        localStorage.setItem(storageKey, widthRef.current.toString());
      } catch {
        // ignore
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleEnd);
    window.addEventListener("touchcancel", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
      window.removeEventListener("touchcancel", handleEnd);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, minWidth, maxWidth, storageKey]);

  return {
    sidebarRef,
    width,
    isResizing,
    startResizing,
    resetWidth,
    handleKeyDown,
    minWidth,
    maxWidth,
  };
}
