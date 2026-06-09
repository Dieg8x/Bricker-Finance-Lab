import { useState } from "react";

interface PayoffChartProps {
  strike: number;
  prima: number;
  type: "call_largo" | "call_corto" | "put_largo" | "put_corto";
}

function PayoffSVG({ strike, prima, type }: PayoffChartProps) {
  const W = 300;
  const H = 140;
  const midY = 75;
  const scale = Math.max(prima * 2.5, 1);
  const toY = (pl: number) => midY - (pl / scale) * 50;
  const strikeX = 150;
  const range = strike * 0.6;
  const toX = (price: number) => ((price - (strike - range)) / (range * 2)) * W;
  const breakeven = type === "call_largo" || type === "call_corto"
    ? strike + prima
    : strike - prima;
  const beX = toX(breakeven);

  // build path points
  const pts: [number, number][] = [];
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const price = (strike - range) + (i / steps) * range * 2;
    let pl = 0;
    if (type === "call_largo") pl = Math.max(price - strike, 0) - prima;
    else if (type === "call_corto") pl = prima - Math.max(price - strike, 0);
    else if (type === "put_largo") pl = Math.max(strike - price, 0) - prima;
    else pl = prima - Math.max(strike - price, 0);
    pts.push([toX(price), toY(pl)]);
  }
  const pathD = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");

  // fill areas
  const gainPts = pts.filter(p => p[1] < midY);
  const lossPts = pts.filter(p => p[1] >= midY);

  // colors
  const isGainRight = type === "call_largo" || type === "put_corto";
  const gainColor = "#22c55e";
  const lossColor = "#ef4444";

  const primaY = toY(-prima);
  const primaPoY = toY(prima);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-28">
      {/* Grid */}
      <line x1="0" y1={midY} x2={W} y2={midY} stroke="#94a3b8" strokeWidth="1.5" />
      <line x1={strikeX} y1="5" x2={strikeX} y2={H - 5} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,3" />
      {beX > 0 && beX < W && (
        <line x1={beX} y1="5" x2={beX} y2={H - 5} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
      )}

      {/* Gain fill */}
      {gainPts.length > 1 && (
        <polygon
          points={gainPts.map(p => `${p[0]},${p[1]}`).join(" ") + ` ${gainPts[gainPts.length-1][0]},${midY} ${gainPts[0][0]},${midY}`}
          fill={gainColor}
          opacity="0.15"
        />
      )}
      {/* Loss fill */}
      {lossPts.length > 1 && (
        <polygon
          points={lossPts.map(p => `${p[0]},${p[1]}`).join(" ") + ` ${lossPts[lossPts.length-1][0]},${midY} ${lossPts[0][0]},${midY}`}
          fill={lossColor}
          opacity="0.15"
        />
      )}

      {/* Payoff line */}
      <path d={pathD} fill="none" stroke="#1e40af" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Labels */}
      <text x={strikeX + 3} y={H - 3} fontSize="9" fill="#3b82f6" fontWeight="bold">SP {strike}</text>
      {beX > 20 && beX < W - 20 && (
        <text x={beX + 3} y={H - 3} fontSize="8" fill="#f59e0b" fontWeight="bold">BE {breakeven.toFixed(2)}</text>
      )}

      {/* Prima label */}
      {(type === "call_largo" || type === "put_largo") && primaY < H && primaY > 0 && (
        <text x="3" y={primaY + 4} fontSize="9" fill="#ef4444">{prima}</text>
      )}
      {(type === "call_corto" || type === "put_corto") && primaPoY < H && primaPoY > 0 && (
        <text x="3" y={primaPoY + 4} fontSize="9" fill="#22c55e">{prima}</text>
      )}

      {/* Area labels */}
      {isGainRight ? (
        <>
          <text x={W - 55} y="16" fontSize="8" fill="#22c55e" fontWeight="bold">área ganancia</text>
          <text x="5" y="16" fontSize="8" fill="#ef4444" fontWeight="bold">área pérdida</text>
        </>
      ) : (
        <>
          <text x="5" y="16" fontSize="8" fill="#22c55e" fontWeight="bold">área ganancia</text>
          <text x={W - 55} y="16" fontSize="8" fill="#ef4444" fontWeight="bold">área pérdida</text>
        </>
      )}

      {/* P&L axis label */}
      <text x="2" y={midY - 3} fontSize="8" fill="#64748b">0</text>
    </svg>
  );
}

const POSITIONS = [
  {
    key: "call_largo" as const,
    title: "CALL LARGO",
    subtitle: "Long Call — derecho a COMPRAR",
    badge: "Comprador de Call",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    headerColor: "bg-blue-600",
    explanation: "YO pago la prima para tener el derecho de comprar al Strike Price.",
    mechanics: [
      "Pérdida máxima: la prima pagada (limitada)",
      "Ganancia: ilimitada si el precio sube",
      "Punto de equilibrio: SP + prima",
      "Se ejerce cuando precio > SP (está In-The-Money)",
    ],
    examTip: "Úsalo cuando esperas que el precio SUBA. Tu pérdida máxima ya está limitada a la prima.",
  },
  {
    key: "call_corto" as const,
    title: "CALL CORTO",
    subtitle: "Short Call — obligación de VENDER",
    badge: "Vendedor de Call",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    headerColor: "bg-rose-600",
    explanation: "YO cobro la prima y ME OBLIGO a vender al Strike Price si el comprador ejerce.",
    mechanics: [
      "Ganancia máxima: la prima cobrada (limitada)",
      "Pérdida: ilimitada si el precio sube mucho",
      "Punto de equilibrio: SP + prima",
      "La contraparte ejerce cuando precio > SP",
    ],
    examTip: "El vendedor siempre COBRA prima. Su ganancia máxima es la prima; su riesgo es ilimitado al alza.",
  },
  {
    key: "put_largo" as const,
    title: "PUT LARGO",
    subtitle: "Long Put — derecho a VENDER",
    badge: "Comprador de Put",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    headerColor: "bg-emerald-600",
    explanation: "YO pago la prima para tener el derecho de VENDER al Strike Price si el precio baja.",
    mechanics: [
      "Pérdida máxima: la prima pagada (limitada)",
      "Ganancia: sube conforme el precio BAJA (máx: SP - prima)",
      "Punto de equilibrio: SP - prima",
      "Se ejerce cuando precio < SP (está In-The-Money)",
    ],
    examTip: "Úsalo cuando esperas que el precio BAJE, o para proteger una posición larga que ya tienes.",
  },
  {
    key: "put_corto" as const,
    title: "PUT CORTO",
    subtitle: "Short Put — obligación de COMPRAR",
    badge: "Vendedor de Put",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    headerColor: "bg-amber-600",
    explanation: "YO cobro la prima y ME OBLIGO a comprar al Strike Price si el comprador ejerce.",
    mechanics: [
      "Ganancia máxima: la prima cobrada (limitada)",
      "Pérdida máxima: SP - prima (si el activo cae a cero)",
      "Punto de equilibrio: SP - prima",
      "La contraparte ejerce cuando precio < SP",
    ],
    examTip: "pov vendedor: si el precio sube, el comprador NO ejerce y te quedas con la prima. Si baja mucho, pierdes.",
  },
];

export function OptionsGuide() {
  const [strike, setStrike] = useState(15.75);
  const [callPrima, setCallPrima] = useState(3.5);
  const [putPrima, setPutPrima] = useState(3.5);

  const getPrima = (key: string) =>
    key === "call_largo" || key === "call_corto" ? callPrima : putPrima;

  return (
    <div className="grid gap-6">
      {/* Controls */}
      <div className="rounded-xl bg-slate-900 p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Ajusta los valores para ver los diagramas en tiempo real</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Strike Price (SP)", value: strike, set: setStrike, step: 0.25 },
            { label: "Prima del Call", value: callPrima, set: setCallPrima, step: 0.25 },
            { label: "Prima del Put", value: putPrima, set: setPutPrima, step: 0.25 },
          ].map(({ label, value, set, step }) => (
            <label key={label} className="grid gap-1">
              <span className="text-[11px] font-bold text-slate-300">{label}</span>
              <input
                type="number"
                step={step}
                value={value}
                onChange={e => set(parseFloat(e.target.value) || 0)}
                className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-emerald-300 font-mono outline-none focus:border-brand focus:ring-1 focus:ring-brand"
              />
              <span className="text-[10px] text-slate-500">
                {label.includes("Call") || label.includes("Put")
                  ? `BE = ${label.includes("Call") ? (strike + value).toFixed(2) : (strike - value).toFixed(2)}`
                  : ""}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* 4 position cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        {POSITIONS.map(pos => (
          <div key={pos.key} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-soft">
            {/* Header */}
            <div className={`${pos.headerColor} px-4 py-2.5 flex items-center justify-between`}>
              <div>
                <p className="text-sm font-black text-white">{pos.title}</p>
                <p className="text-[11px] text-white/80">{pos.subtitle}</p>
              </div>
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${pos.badgeColor}`}>
                {pos.badge}
              </span>
            </div>

            {/* Chart */}
            <div className="px-3 pt-3">
              <PayoffSVG
                strike={strike}
                prima={getPrima(pos.key)}
                type={pos.key}
              />
            </div>

            {/* Explanation */}
            <div className="px-4 pb-4 pt-1 grid gap-2">
              <p className="text-sm font-semibold text-ink leading-5">{pos.explanation}</p>
              <ul className="grid gap-1">
                {pos.mechanics.map(m => (
                  <li key={m} className="flex gap-1.5 text-xs text-slate-600 leading-4">
                    <span className="mt-0.5 text-brand shrink-0">•</span>
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 mt-1">
                <p className="text-[11px] font-bold text-amber-700 uppercase mb-0.5">Tip de examen</p>
                <p className="text-xs text-amber-800 leading-4">{pos.examTip}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick reference table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="bg-brand px-4 py-2.5">
          <p className="text-sm font-bold text-white">Resumen rápido — las 4 posiciones</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-3 py-2 text-left font-bold text-slate-600">Posición</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Paga/cobra prima</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Ganancia máx.</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Pérdida máx.</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Punto equilibrio</th>
                <th className="px-3 py-2 text-left font-bold text-slate-600">Apuesta a...</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Call Largo (+C)", "PAGA prima", "Ilimitada", `Prima = $${callPrima}`, `SP + prima = $${(strike+callPrima).toFixed(2)}`, "Precio SUBE"],
                ["Call Corto (−C)", "COBRA prima", `Prima = $${callPrima}`, "Ilimitada", `SP + prima = $${(strike+callPrima).toFixed(2)}`, "Precio no sube"],
                ["Put Largo (+P)", "PAGA prima", `SP − prima = $${(strike-putPrima).toFixed(2)}`, `Prima = $${putPrima}`, `SP − prima = $${(strike-putPrima).toFixed(2)}`, "Precio BAJA"],
                ["Put Corto (−P)", "COBRA prima", `Prima = $${putPrima}`, `SP − prima = $${(strike-putPrima).toFixed(2)}`, `SP − prima = $${(strike-putPrima).toFixed(2)}`, "Precio no baja"],
              ].map(([pos, paga, ganancia, perdida, be, apuesta]) => (
                <tr key={pos} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2 font-bold text-ink">{pos}</td>
                  <td className="px-3 py-2 text-slate-600">{paga}</td>
                  <td className="px-3 py-2 text-emerald-700 font-semibold">{ganancia}</td>
                  <td className="px-3 py-2 text-rose-700 font-semibold">{perdida}</td>
                  <td className="px-3 py-2 text-amber-700 font-mono">{be}</td>
                  <td className="px-3 py-2 text-slate-600">{apuesta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
