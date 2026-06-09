const STORAGE_KEY = "bricker_history";
const MAX_ENTRIES = 5;

export interface HistoryEntry {
  topicTitle: string;
  topicId: string;
  summary: string;
  timestamp: number;
}

export function saveToHistory(topicTitle: string, topicId: string, summary: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: HistoryEntry[] = raw ? JSON.parse(raw) : [];
    const newEntry: HistoryEntry = { topicTitle, topicId, summary, timestamp: Date.now() };
    const filtered = existing.filter((e) => e.topicId !== topicId);
    const updated = [newEntry, ...filtered].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // silently ignore storage errors
  }
}

export { STORAGE_KEY };
