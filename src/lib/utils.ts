import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCopy(copy: string | undefined | null): string {
  if (!copy) return '';
  let formatted = String(copy);
  
  // Remove surrounding quotes if they exist
  if (formatted.startsWith('"') && formatted.endsWith('"')) {
    formatted = formatted.substring(1, formatted.length - 1);
  }
  
  // Replace literal \n with actual newlines
  formatted = formatted.replace(/\\n/g, '\n');
  
  // Replace HTML break tags with newlines
  formatted = formatted.replace(/<br\s*\/?>/gi, '\n');
  
  // Replace literal \r with nothing
  formatted = formatted.replace(/\\r/g, '');
  
  // Replace multiple newlines with just two to avoid massive gaps
  formatted = formatted.replace(/\n{3,}/g, '\n\n');
  
  // Unescape common HTML entities that AI might generate
  formatted = formatted.replace(/&amp;/g, '&')
                       .replace(/&lt;/g, '<')
                       .replace(/&gt;/g, '>')
                       .replace(/&quot;/g, '"')
                       .replace(/&#39;/g, "'");

  return formatted.trim();
}

/**
 * Copies markdown-formatted text to the clipboard as both:
 * 1. Rich HTML (so it pastes with bold bold styling into Slack, Google Docs, etc.)
 * 2. Clean Plain Text (stripping out raw markdown ** and * markers)
 */
export async function copyFormattedText(text: string | undefined | null): Promise<boolean> {
  if (!text) return false;

  const cleanedText = formatCopy(text);

  // Generate HTML representations with universal bold styling (b tag + inline style) for maximum compatibility.
  let html = cleanedText
    .replace(/\*\*(.*?)\*\*/g, '<b style="font-weight: bold;">$1</b>')
    .replace(/__(.*?)__/g, '<b style="font-weight: bold;">$1</b>')
    .replace(/\*(.*?)\*/g, '<i style="font-style: italic;">$1</i>')
    .replace(/_(.*?)_/g, '<i style="font-style: italic;">$1</i>')
    .replace(/\n/g, "<br />");

  // Create clean plain text representation.
  // Retaining double asterisks ensures markdown-aware editors (like Notion, Slack) render bold correctly,
  // and keeps emphasis on unstyled inputs rather than stripping formatting entirely.
  const plainText = cleanedText;

  try {
    if (typeof ClipboardItem !== "undefined" && navigator.clipboard && navigator.clipboard.write) {
      const blobHtml = new Blob([html], { type: "text/html" });
      const blobText = new Blob([plainText], { type: "text/plain" });

      const data = [
        new ClipboardItem({
          "text/html": blobHtml,
          "text/plain": blobText,
        }),
      ];
      await navigator.clipboard.write(data);
      return true;
    } else {
      throw new Error("ClipboardItem / write not supported on navigator");
    }
  } catch (error) {
    console.warn("ClipboardItem write failed, trying execCommand html selection fallback:", error);
    try {
      // execCommand fallback for rich text HTML inside iframes:
      const container = document.createElement("div");
      container.innerHTML = html;
      container.style.position = "fixed";
      container.style.top = "-9999px";
      container.style.left = "-9999px";
      container.style.opacity = "0";
      container.style.pointerEvents = "none";
      container.style.whiteSpace = "pre-wrap";
      document.body.appendChild(container);

      const range = document.createRange();
      range.selectNodeContents(container);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
        const successful = document.execCommand("copy");
        selection.removeAllRanges();
        document.body.removeChild(container);
        if (successful) return true;
      } else {
        document.body.removeChild(container);
      }
    } catch (execErr) {
      console.warn("execCommand fallback failed:", execErr);
    }

    try {
      await navigator.clipboard.writeText(plainText);
      return true;
    } catch (fallbackErr) {
      console.error("All copy strategies failed:", fallbackErr);
      return false;
    }
  }
}

export function utcToLocal(utcTime: string): string {
  if (!utcTime) return "12:00";
  const [hours, minutes] = utcTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "12:00";
  
  const totalUtcMinutes = hours * 60 + minutes;
  const offsetMinutes = new Date().getTimezoneOffset();
  let totalLocalMinutes = (totalUtcMinutes - offsetMinutes) % 1440;
  if (totalLocalMinutes < 0) totalLocalMinutes += 1440;
  
  const localHours = Math.floor(totalLocalMinutes / 60).toString().padStart(2, "0");
  const localMinutes = (totalLocalMinutes % 60).toString().padStart(2, "0");
  return `${localHours}:${localMinutes}`;
}

export function localToUtc(localTime: string): string {
  if (!localTime) return "12:00";
  const [hours, minutes] = localTime.split(":").map(Number);
  if (isNaN(hours) || isNaN(minutes)) return "12:00";
  
  const totalLocalMinutes = hours * 60 + minutes;
  const offsetMinutes = new Date().getTimezoneOffset();
  let totalUtcMinutes = (totalLocalMinutes + offsetMinutes) % 1440;
  if (totalUtcMinutes < 0) totalUtcMinutes += 1440;
  
  const utcHours = Math.floor(totalUtcMinutes / 60).toString().padStart(2, "0");
  const utcMinutes = (totalUtcMinutes % 60).toString().padStart(2, "0");
  return `${utcHours}:${utcMinutes}`;
}

