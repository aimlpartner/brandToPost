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
