import { useState } from "react";

interface Props {
  onSelect: (id: string) => void;
}

type Category = "futuros" | "opciones" | "swaps" | "tasas" | null;

const categories: { id: Category; label: string; emoji: string }[] = [
  { id: "futuros", label: "Futuros / Forwards", emoji: "📈" },
  { id: "opciones", label: "Opciones", emoji: "🎯" },
  { id: "swaps", label: "Swaps", emoji: "🔄" },
  { id: "tasas", label: "Tasas y FRA", emoji: "📊" },
];

const options: Record<NonNullable<Category>, { label: string; id: string }[]> = {
  futuros: [
    { label: "Precio futuro accion (con/sin dividendo + nocional)", id: "stock_future" },
    { label: "Precio futuro commodity", id: "commodity_future" },
    { label: "Precio futuro indice (IPC/S&P)", id: "index_future" },
    { label: "Cobertura portafolio IPC", id: "ipc_coverage" },
    { label: "Cobertura acciones con futuros", id: "stock_future_coverage" },
    { label: "Cobertura commodity con futuros", id: "commodity_coverage" },
    { label: "Margenes / Margin Call", id: "futures_margins_calc" },
    { label: "Numero de contratos", id: "future_fra_basic" },
  ],
  opciones: [
    { label: "Black-Scholes (prima + griegas)", id: "options_greeks" },
    { label: "Binomial (un periodo)", id: "binomial_option" },
    { label: "Estrategias (spreads / straddle)", id: "option_strategies" },
    { label: "Guia visual 4 posiciones", id: "options_visual_guide" },
  ],
  swaps: [
    { label: "Swap de tasas simple (VPN)", id: "simple_swap" },
    { label: "Equity Swap", id: "equity_swap" },
    { label: "Ventaja comparativa + diagrama H", id: "comparative_advantage" },
  ],
  tasas: [
    { label: "Forward de divisas (MXN/USD)", id: "forward_fx" },
    { label: "Forward de tasas de interes", id: "forward_rate" },
    { label: "FRA liquidacion", id: "fra_calculator" },
    { label: "Tasas alambradas", id: "wired_rates" },
  ],
};

export function FormulaFinder({ onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Category>(null);

  function reset() {
    setSelected(null);
  }

  function handleSelect(id: string) {
    onSelect(id);
    setOpen(false);
    setSelected(null);
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-blue-100/60 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🧭</span>
          <div>
            <p className="text-sm font-bold text-brand">¿Qué fórmula necesito?</p>
            <p className="text-xs text-slate-500">Asistente de selección — haz clic para abrir</p>
          </div>
        </div>
        <span className={`text-brand font-bold transition-transform duration-200 ${open ? "rotate-90" : ""}`}>
          ▶
        </span>
      </button>

      {open && (
        <div className="border-t border-blue-200 px-5 py-4">
          {!selected ? (
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-3">¿Qué tipo de instrumento?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelected(cat.id)}
                    className="flex flex-col items-center gap-1.5 rounded-xl border border-blue-200 bg-white px-3 py-3 text-center text-sm font-semibold text-brand hover:bg-brand hover:text-white hover:border-brand transition-colors shadow-sm"
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-3 mb-3">
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-brand font-bold hover:underline"
                >
                  ← Reiniciar
                </button>
                <p className="text-sm font-semibold text-slate-700">¿Qué necesitas?</p>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {options[selected].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className="text-left rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-brand hover:text-white hover:border-brand transition-colors shadow-sm"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
