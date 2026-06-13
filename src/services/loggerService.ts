import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../firebase";

export interface LogEntry {
  id: string;
  timestamp: string; // ISO string for local display
  level: "info" | "warn" | "error" | "success";
  section: "campaign" | "image" | "overlay" | "system" | "whatsapp";
  message: string;
  details?: string;
}

type LogListener = (logs: LogEntry[]) => void;

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();

  constructor() {
    this.addLog("system", "info", "Logger service initialized. Live tracking active.");
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear(): void {
    this.logs = [];
    this.notify();
  }

  public addLog(
    section: LogEntry["section"],
    level: LogEntry["level"],
    message: string,
    details?: string
  ): void {
    const entry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      timestamp: new Date().toISOString(),
      level,
      section,
      message,
      details,
    };

    this.logs.unshift(entry); // Newest logs first
    if (this.logs.length > 300) {
      this.logs.pop(); // Keep buffer manageable
    }

    console.log(`[${section.toUpperCase()}][${level.toUpperCase()}] ${message}`, details || "");

    // Persist log asynchronously if active user is signed in to double-ensure traceability in Firestore
    this.persistToFirestore(entry).catch((err) => {
      console.warn("Silent failure saving log to Firestore:", err);
    });

    this.notify();
  }

  private async persistToFirestore(entry: LogEntry): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser || !db) return;

    try {
      await addDoc(collection(db, "generation_logs"), {
        userId: currentUser.uid,
        userEmail: currentUser.email,
        timestamp: serverTimestamp(),
        level: entry.level,
        section: entry.section,
        message: entry.message,
        details: entry.details || null,
        clientTimestamp: entry.timestamp,
      });
    } catch (e) {
      // Invariant: Fail silently to prevent logger itself from blocking app execution
    }
  }

  public subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    // Emit current state instantly upon subscription
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const currentLogs = [...this.logs];
    this.listeners.forEach((listener) => {
      try {
        listener(currentLogs);
      } catch (e) {
        console.error("Error in logger subscriber:", e);
      }
    });
  }
}

export const loggerService = new LoggerService();
