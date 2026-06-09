import type { CalculationResult } from "../lib/types";

interface Props {
  result: CalculationResult;
}

function pct(value: number, decimals = 4): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

interface ArrowLabelProps {
  label: string;
  value: string;
  direction: "right" | "left";
  color?: string;
}

function ArrowLabel({ label, value, direction, color = "text-slate-700" }: ArrowLabelProps) {
  return (
    <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
      <span className={`text-[11px] font-bold ${color}`}>{value}</span>
      <div className="relative w-full flex items-center">
        {direction === "right" ? (
          <>
            <div className="flex-1 h-0.5 bg-current" />
            <span className="text-current text-sm">▶</span>
          </>
        ) : (
          <>
            <span className="text-current text-sm">◀</span>
            <div className="flex-1 h-0.5 bg-current" />
          </>
        )}
      </div>
      <span className="text-[10px] text-slate-500 text-center leading-3">{label}</span>
    </div>
  );
}

export function ComparativeAdvantageChart({ result }: Props) {
  const r = result.results as Record<string, number>;

  const fixedA = r.fixedA ?? 0;
  const variableA = r.variableA ?? r.referenceRate ?? 0;
  const fixedB = r.fixedB ?? 0;
  const variableB = r.variableB ?? 0;
  const swapFixedA = r.swapFixedA ?? 0;
  const swapFixedB = r.swapFixedB ?? 0;
  const referenceRate = r.referenceRate ?? 0;
  const netA = r.netA ?? 0;
  const netB = r.netB ?? 0;
  const benefitA = r.benefitA ?? 0;
  const benefitB = r.benefitB ?? 0;
  const bankShare = r.bankShare ?? 0;
  const totalAdvantage = r.totalAdvantage ?? 0;
  const splitRatio = r.splitRatio ?? 0.5;

  if (totalAdvantage <= 0) return null;

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      <div className="bg-brand px-5 py-3">
        <h3 className="text-base font-bold text-white">Diagrama H — Flujos del Swap</h3>
        <p className="text-xs text-blue-100 mt-0.5">Reparto {Math.round(splitRatio * 100)}/{Math.round((1 - splitRatio) * 100)} · Comisión banco: {pct(bankShare)}</p>
      </div>

      <div className="p-5">
        {/* ── Main H diagram ─────────────────────────────────────── */}
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-3 items-start mb-6">

          {/* Company A */}
          <div className="flex flex-col gap-2">
            <div className="rounded-xl border-2 border-brand bg-blue-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-brand mb-1">Empresa A</p>
              <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                <span className="text-slate-500">Fija:</span>
                <span className="font-bold text-ink">{pct(fixedA, 2)}</span>
                <span className="text-slate-500">Variable:</span>
                <span className="font-bold text-ink">{pct(variableA, 2)}</span>
              </div>
              <div className="mt-3 rounded-lg bg-emerald-100 border border-emerald-300 px-2 py-1.5">
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Tasa efectiva</p>
                <p className="text-base font-black text-emerald-800">{pct(netA, 4)} fija</p>
                <p className="text-[10px] text-emerald-700">Ahorro: {pct(benefitA, 4)}</p>
              </div>
            </div>
            {/* A's external borrowing */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-slate-400" />
              <span className="text-[10px] font-bold text-slate-500">Mercado</span>
              <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-center mt-1">
                <p className="text-[10px] text-slate-500">A toma prestado a</p>
                <p className="text-sm font-black text-slate-700">{pct(variableA, 2)} variable</p>
                <p className="text-[10px] text-slate-400">(ventaja comparativa de A)</p>
              </div>
            </div>
          </div>

          {/* Center: swap arrows + Bank */}
          <div className="flex flex-col items-center gap-1 pt-1 min-w-[160px]">
            {/* Fixed arrow: A → Bank */}
            <div className="w-full flex items-center gap-1 text-rose-600">
              <ArrowLabel
                label="A paga fijo al banco"
                value={pct(swapFixedA, 4)}
                direction="right"
                color="text-rose-600"
              />
            </div>

            {/* Variable arrow: Bank → A */}
            <div className="w-full flex items-center gap-1 text-emerald-600">
              <ArrowLabel
                label="Banco paga variable a A"
                value={pct(referenceRate, 4)}
                direction="left"
                color="text-emerald-600"
              />
            </div>

            {/* Bank box */}
            <div className="my-2 w-full rounded-xl border-2 border-amber-400 bg-amber-50 p-3 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Banco</p>
              <div className="mt-2 rounded-lg bg-amber-100 px-2 py-1">
                <p className="text-[10px] text-amber-700 font-bold">Comisión</p>
                <p className="text-sm font-black text-amber-800">{pct(bankShare, 4)}</p>
              </div>
              <p className="text-[9px] text-amber-600 mt-1 leading-3">
                Recibe {pct(swapFixedA, 2)} fijo<br/>
                Paga {pct(swapFixedB, 2)} fijo<br/>
                Variable se cancela
              </p>
            </div>

            {/* Variable arrow: B → Bank */}
            <div className="w-full flex items-center gap-1 text-emerald-600">
              <ArrowLabel
                label="B paga variable al banco"
                value={pct(referenceRate, 4)}
                direction="right"
                color="text-emerald-600"
              />
            </div>

            {/* Fixed arrow: Bank → B */}
            <div className="w-full flex items-center gap-1 text-rose-600">
              <ArrowLabel
                label="Banco paga fijo a B"
                value={pct(swapFixedB, 4)}
                direction="left"
                color="text-rose-600"
              />
            </div>
          </div>

          {/* Company B */}
          <div className="flex flex-col gap-2">
            <div className="rounded-xl border-2 border-brand bg-blue-50 p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-brand mb-1">Empresa B</p>
              <div className="grid grid-cols-2 gap-1 text-xs mt-2">
                <span className="text-slate-500">Fija:</span>
                <span className="font-bold text-ink">{pct(fixedB, 2)}</span>
                <span className="text-slate-500">Variable:</span>
                <span className="font-bold text-ink">{pct(variableB, 2)}</span>
              </div>
              <div className="mt-3 rounded-lg bg-emerald-100 border border-emerald-300 px-2 py-1.5">
                <p className="text-[10px] text-emerald-700 font-bold uppercase">Tasa efectiva</p>
                <p className="text-base font-black text-emerald-800">{pct(netB, 4)} variable</p>
                <p className="text-[10px] text-emerald-700">Ahorro: {pct(benefitB, 4)}</p>
              </div>
            </div>
            {/* B's external borrowing */}
            <div className="flex flex-col items-center">
              <div className="w-0.5 h-6 bg-slate-400" />
              <span className="text-[10px] font-bold text-slate-500">Mercado</span>
              <div className="rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-center mt-1">
                <p className="text-[10px] text-slate-500">B toma prestado a</p>
                <p className="text-sm font-black text-slate-700">{pct(fixedB, 2)} fija</p>
                <p className="text-[10px] text-slate-400">(ventaja comparativa de B)</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reading guide ──────────────────────────────────────── */}
        <div className="rounded-lg bg-slate-50 border border-slate-200 p-4">
          <p className="text-xs font-bold text-slate-700 mb-2">Cómo leer el diagrama</p>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-600 leading-5">
            <div>
              <span className="font-bold text-rose-600">Flechas rojas</span> = flujos de tasa <em>fija</em> intercambiados con el banco
            </div>
            <div>
              <span className="font-bold text-emerald-600">Flechas verdes</span> = flujo de tasa <em>variable</em> de referencia ({pct(referenceRate, 2)})
            </div>
            <div>
              A convierte su deuda <em>variable → fija</em>: paga {pct(variableA, 2)} al mercado y {pct(swapFixedA, 4)} al banco, recibe {pct(referenceRate, 4)} del banco → <strong>neto {pct(netA, 4)} fija</strong>
            </div>
            <div>
              B convierte su deuda <em>fija → variable</em>: paga {pct(fixedB, 2)} al mercado y {pct(referenceRate, 4)} al banco, recibe {pct(swapFixedB, 4)} del banco → <strong>neto {pct(netB, 4)} variable</strong>
            </div>
          </div>
        </div>

        {/* ── Savings summary ─────────────────────────────────────── */}
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-[10px] font-bold uppercase text-brand">Empresa A ahorra</p>
            <p className="text-xl font-black text-brand mt-1">{pct(benefitA, 4)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">vs tomar fijo directo en mercado</p>
          </div>
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="text-[10px] font-bold uppercase text-amber-700">Banco gana</p>
            <p className="text-xl font-black text-amber-700 mt-1">{pct(bankShare, 4)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{pct(bankShare / Math.max(totalAdvantage, 0.0001) * 1, 0)} de la ventaja total</p>
          </div>
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-[10px] font-bold uppercase text-brand">Empresa B ahorra</p>
            <p className="text-xl font-black text-brand mt-1">{pct(benefitB, 4)}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">vs tomar variable directo en mercado</p>
          </div>
        </div>
      </div>
    </section>
  );
}
