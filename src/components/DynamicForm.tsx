import { Fragment } from "react";
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

      {topic.useCase && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-4 py-3">
          <span className="mt-0.5 text-amber-500 shrink-0">&#9654;</span>
          <p className="text-sm font-medium text-amber-800">{topic.useCase}</p>
        </div>
      )}

      {topic.formulaDisplay && (
        <div className="mb-5 rounded-lg bg-slate-900 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Formula</p>
          <p className="font-mono text-sm leading-6 text-emerald-300 break-words">{topic.formulaDisplay}</p>
        </div>
      )}

      <div className="grid gap-4">
        {topic.inputs.map((field, i) => {
          const prevSection = i > 0 ? topic.inputs[i - 1].section : undefined;
          const showSection = field.section && field.section !== prevSection;
          return (
          <Fragment key={field.key}>
          {showSection && (
            <div className="border-t border-dashed border-slate-200 pt-3 -mb-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{field.section}</p>
            </div>
          )}
          <label className="grid gap-1.5">
            <span className="flex items-center gap-2 text-sm font-bold text-ink">
              {field.label}
              {field.unit ? <span className="font-normal text-slate-500">({field.unit})</span> : null}
              {field.formulaVar ? (
                <span className="ml-auto rounded bg-brand/10 px-1.5 py-0.5 font-mono text-[11px] font-bold text-brand">
                  {field.formulaVar}
                </span>
              ) : null}
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
            ) : field.isPercent ? (
              <input
                className="rounded-lg border border-slate-300 bg-yellow-50 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
                type="number"
                step="any"
                value={(() => {
                  const raw = Number(values[field.key]);
                  if (isNaN(raw)) return "";
                  // Round to avoid floating-point display noise (e.g. 5.550000000001)
                  return String(Math.round(raw * 100 * 1e8) / 1e8);
                })()}
                onChange={(event) => {
                  const v = parseFloat(event.target.value);
                  if (isNaN(v)) { onChange(field.key, 0); return; }
                  // Store rounded decimal to avoid float noise (e.g. 5.55/100 = 0.0555 not 0.055500000004)
                  onChange(field.key, Math.round((v / 100) * 1e10) / 1e10);
                }}
              />
            ) : (
              <input
                className="rounded-lg border border-slate-300 bg-yellow-50 px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-blue-100"
                type="number"
                step="any"
                value={values[field.key]}
                onChange={(event) => onChange(field.key, event.target.value)}
              />
            )}

            {field.isPercent && (
              <span className="inline-block mt-0.5 rounded bg-emerald-100 border border-emerald-200 px-2 py-0.5 text-xs font-semibold text-emerald-700 w-fit">
                = {(Number(values[field.key]) * 100).toFixed(4)}% {field.percentSuffix ?? "anual"}
              </span>
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
          </Fragment>
          );
        })}
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
