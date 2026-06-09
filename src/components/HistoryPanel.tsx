import { useState, useEffect } from "react";
import { type HistoryEntry, STORAGE_KEY } from "../lib/history";

function relativeTime(ts: number): string {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`;
  return `hace ${Math.floor(diff / 86400)} días`;
}

interface Props {
  onRestore?: (id: string) => void;
}

export function HistoryPanel({ onRestore }: Props) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    if (!open) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setEntries(raw ? JSON.parse(raw) : []);
    } catch {
      setEntries([]);
    }
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/70 px-5 py-3 text-left shadow-sm hover:bg-white transition-colors"
      >
        <span className="text-lg">🕐</span>
        <div>
          <p className="text-sm font-bold text-ink">Historial de cálculos</p>
          <p className="text-xs text-slate-500">Ver los últimos 5 cálculos realizados</p>
        </div>
        <span className="ml-auto text-slate-400 text-sm">▶</span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/70 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100"
      >
        <span className="text-lg">🕐</span>
        <p className="text-sm font-bold text-ink">Historial de cálculos</p>
        <span className="ml-auto text-brand font-bold text-sm rotate-90">▶</span>
      </button>

      <div className="px-5 py-3">
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">Aún no hay cálculos en el historial.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {entries.map((entry) => (
              <li key={entry.topicId + entry.timestamp} className="py-2.5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink truncate">{entry.topicTitle}</p>
                  <p className="text-xs text-slate-500">{entry.summary} · {relativeTime(entry.timestamp)}</p>
                </div>
                {onRestore && (
                  <button
                    type="button"
                    onClick={() => onRestore(entry.topicId)}
                    className="shrink-0 text-xs font-bold text-brand border border-blue-200 bg-blue-50 rounded-lg px-2.5 py-1 hover:bg-brand hover:text-white transition-colors"
                  >
                    Abrir
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
