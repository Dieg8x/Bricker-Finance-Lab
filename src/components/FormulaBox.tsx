import { useState } from "react";

interface Props {
  formula: string;
  hidden: boolean;
}

export function FormulaBox({ formula, hidden }: Props) {
  const [revealed, setRevealed] = useState(false);

  if (!formula) return null;

  return (
    <section className="rounded-lg border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-ink">Formula utilizada</h3>
        {hidden && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            {revealed ? "Ocultar" : "Ver formula"}
          </button>
        )}
      </div>
      <div className="rounded-md bg-slate-900 px-4 py-3">
        {hidden && !revealed ? (
          <p className="font-mono text-sm text-slate-400 italic">
            Presiona &ldquo;Ver formula&rdquo; para revelarla, o calcula primero para el desglose completo.
          </p>
        ) : (
          <p className="font-mono text-sm leading-6 text-emerald-300 break-words">{formula}</p>
        )}
      </div>
    </section>
  );
}
