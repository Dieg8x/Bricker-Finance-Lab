import type { CalculationInput, TopicDefinition } from "../lib/types";
import type { ActiveRates } from "../lib/banxico";

interface Props {
  topic: TopicDefinition;
  values: CalculationInput;
  onChange: (key: string, value: number | string) => void;
  onSubmit: () => void;
  onReset: () => void;
  activeRates?: ActiveRates | null;
}

export function DynamicForm({ topic, values, onChange, onSubmit, onReset, activeRates }: Props) {
  return (
    <form
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-brand">{topic.sheet}</p>
        <h2 className="mt-1 text-2xl font-bold text-ink">{topic.title}</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">{topic.description}</p>
      </div>

      <div className="grid gap-4">
        {topic.inputs.map((field) => (
          <label key={field.key} className="grid gap-1.5">
            <span className="text-sm font-bold text-ink">
              {field.label}
              {field.unit ? <span className="font-normal text-slate-500"> ({field.unit})</span> : null}
            </span>
            {field.type === "select" ? (
              <select
                className="rounded-lg border border-slate-300 bg-yellow-50 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
                value={values[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
              >
                {field.options?.map((option) => (
                  <option key={String(option.value)} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="rounded-lg border border-slate-300 bg-yellow-50 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
                type="number"
                step="any"
                value={values[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            )}
            
            {activeRates && field.key.toLowerCase().includes("rate") && (
              <div className="flex gap-2 flex-wrap mt-1">
                {activeRates.cetes28 && (
                  <button 
                    type="button" 
                    onClick={() => onChange(field.key, activeRates.cetes28.dato)}
                    className="text-[11px] bg-blue-50 text-brand border border-blue-200 rounded px-2 py-0.5 font-medium hover:bg-blue-100"
                  >
                    ⚡ CETES 28d ({(activeRates.cetes28.dato * 100).toFixed(2)}%)
                  </button>
                )}
                {activeRates.tiie28 && (
                  <button 
                    type="button" 
                    onClick={() => onChange(field.key, activeRates.tiie28.dato)}
                    className="text-[11px] bg-blue-50 text-brand border border-blue-200 rounded px-2 py-0.5 font-medium hover:bg-blue-100"
                  >
                    ⚡ TIIE 28d ({(activeRates.tiie28.dato * 100).toFixed(2)}%)
                  </button>
                )}
              </div>
            )}
            
            {field.helper ? <span className="text-xs leading-5 text-slate-500">{field.helper}</span> : null}
          </label>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-bold text-ink" onClick={onReset}>
          Limpiar
        </button>
        <button type="submit" className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-[#173d60]">
          Calcular
        </button>
      </div>
    </form>
  );
}
