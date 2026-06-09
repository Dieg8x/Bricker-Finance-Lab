import type { CalculationInput, CalculationResult } from "../lib/types";

interface Props {
  topicId: string;
  values: CalculationInput;
  result?: CalculationResult;
}

function fmt(n: number, dec = 2): string {
  return n.toLocaleString("es-MX", { minimumFractionDigits: dec, maximumFractionDigits: dec });
}
function fmtPct(n: number): string {
  return (n * 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}
function scenarios9(base: number): number[] {
  return [0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20].map((f) => base * f);
}
function closestIndex(arr: number[], target: number): number {
  return arr.reduce((best, val, idx) => Math.abs(val - target) < Math.abs(arr[best] - target) ? idx : best, 0);
}

// ── Payoff line chart (SVG) ─────────────────────────────────────────────────
interface LineChartProps {
  prices: number[];
  results: number[];
  strike: number;
  days: number;
  position: "long" | "short";
}
function PayoffLineChart({ prices, results, strike, days, position }: LineChartProps) {
  const W = 560; const H = 180; const padL = 50; const padR = 20; const padT = 20; const padB = 35;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;
  const minR = Math.min(...results);
  const maxR = Math.max(...results);
  const range = Math.max(Math.abs(minR), Math.abs(maxR));
  const scaleY = (v: number) => padT + chartH / 2 - (v / range) * (chartH / 2 - 5);
  const scaleX = (i: number) => padL + (i / (prices.length - 1)) * chartW;
  const zeroY = scaleY(0);

  const pts = prices.map((_, i) => `${scaleX(i).toFixed(1)},${scaleY(results[i]).toFixed(1)}`);
  const gainPoly = pts.filter((_, i) => results[i] >= 0);
  const lossPoly = pts.filter((_, i) => results[i] <= 0);

  // find where line crosses zero (break-even x)
  const beIdx = results.findIndex((r, i) => i > 0 && Math.sign(r) !== Math.sign(results[i - 1]));
  let beX = beIdx > 0
    ? scaleX(beIdx - 1) + (scaleX(beIdx) - scaleX(beIdx - 1)) * Math.abs(results[beIdx - 1]) / (Math.abs(results[beIdx - 1]) + Math.abs(results[beIdx]))
    : scaleX(prices.indexOf(strike));
  const strikeXPos = prices.findIndex(p => Math.abs(p - strike) < 0.001);
  const strikeX = strikeXPos >= 0 ? scaleX(strikeXPos) : beX;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-2xl" style={{ height: "180px" }}>
      {/* Gain area */}
      <polygon
        points={`${padL},${zeroY} ${pts.filter((_, i) => results[i] >= 0).join(" ")} ${pts.filter((_, i) => results[i] >= 0).length > 0 ? scaleX(results.reduce((last, r, i) => r >= 0 ? i : last, 0)).toFixed(1) : scaleX(0)},${zeroY}`}
        fill="#22c55e" opacity="0.15"
      />
      {/* Loss area */}
      <polygon
        points={`${padL},${zeroY} ${pts.filter((_, i) => results[i] <= 0).join(" ")} ${pts.filter((_, i) => results[i] <= 0).length > 0 ? scaleX(results.reduce((last, r, i) => r <= 0 ? i : last, 0)).toFixed(1) : scaleX(0)},${zeroY}`}
        fill="#ef4444" opacity="0.15"
      />
      {/* Zero axis */}
      <line x1={padL} y1={zeroY} x2={W - padR} y2={zeroY} stroke="#94a3b8" strokeWidth="1.5" />
      {/* Strike vertical */}
      <line x1={strikeX} y1={padT} x2={strikeX} y2={H - padB + 5} stroke="#3b82f6" strokeWidth="1" strokeDasharray="4,3" />
      {/* Payoff line */}
      <polyline points={pts.join(" ")} fill="none" stroke="#1e3a5f" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Zero label */}
      <text x={padL - 4} y={zeroY + 4} fontSize="10" fill="#64748b" textAnchor="end">0</text>
      {/* SP label */}
      <text x={strikeX} y={H - padB + 18} fontSize="10" fill="#3b82f6" fontWeight="bold" textAnchor="middle">SP {fmt(strike)}</text>
      {/* Break-even */}
      {beIdx > 0 && (
        <>
          <line x1={beX} y1={padT} x2={beX} y2={H - padB + 5} stroke="#f59e0b" strokeWidth="1" strokeDasharray="3,3" />
          <text x={beX} y={padT - 5} fontSize="9" fill="#f59e0b" fontWeight="bold" textAnchor="middle">Pto. equilibrio</text>
        </>
      )}
      {/* Price axis labels */}
      {prices.filter((_, i) => i % 2 === 0).map((p, j) => {
        const origIdx = j * 2;
        return <text key={p} x={scaleX(origIdx)} y={H - 3} fontSize="9" fill="#64748b" textAnchor="middle">{fmt(p)}</text>;
      })}
      {/* Y axis result labels */}
      {[maxR, minR].map(v => (
        <text key={v} x={padL - 4} y={scaleY(v) + 4} fontSize="9" fill={v >= 0 ? "#16a34a" : "#dc2626"} textAnchor="end">
          {v >= 0 ? "+" : ""}{fmt(v)}
        </text>
      ))}
      {/* Area labels */}
      <text x={W - padR - 55} y={padT + 14} fontSize="9" fill="#16a34a" fontWeight="bold">
        {position === "long" ? "ganancia (sube)" : "ganancia (baja)"}
      </text>
      <text x={padL + 5} y={padT + 14} fontSize="9" fill="#dc2626" fontWeight="bold">
        {position === "long" ? "pérdida (baja)" : "pérdida (sube)"}
      </text>
      {/* Days label */}
      <text x={W / 2} y={padT + 10} fontSize="10" fill="#475569" textAnchor="middle">{days} Días del Plazo</text>
    </svg>
  );
}

// ── Stock future payoff table (matches image format) ───────────────────────
function StockFuturePayoffTable({ values, theoreticalPrice }: { values: CalculationInput; theoreticalPrice: number }) {
  const step = Number(values.payoffStep) || 2;
  const position = String(values.futurePosition || "long") as "long" | "short";
  const days = Number(values.days) || 241;
  const strike = theoreticalPrice;

  // 11 columns: strike - 5*step ... strike + 5*step
  const prices = Array.from({ length: 11 }, (_, i) => {
    const raw = strike - 5 * step + i * step;
    return Math.round(raw * 100) / 100;
  });

  const results = prices.map(p =>
    Math.round((position === "long" ? p - strike : strike - p) * 100) / 100
  );

  return (
    <div className="grid gap-4">
      {/* Transposed table matching the image */}
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="text-xs border-collapse min-w-full">
          <tbody>
            {/* Banner row */}
            <tr>
              <td className="px-3 py-2 bg-yellow-100 font-bold text-amber-800 border border-slate-200 text-xs whitespace-nowrap" />
              <td
                colSpan={prices.length}
                className="px-3 py-2 bg-yellow-200 font-bold text-amber-900 text-center border border-slate-200"
              >
                {days} Días del Plazo
              </td>
            </tr>
            {/* Strike price row */}
            <tr className="bg-slate-50">
              <td className="px-3 py-2 font-semibold text-slate-700 border border-slate-200 whitespace-nowrap text-left" style={{ minWidth: "130px" }}>
                Strike price<br />
                <span className="font-normal text-slate-500">(Precio pactado)</span>
              </td>
              {prices.map((_, i) => (
                <td key={i} className="px-2 py-2 text-center border border-slate-200 font-mono font-semibold text-slate-700">
                  {fmt(strike)}
                </td>
              ))}
            </tr>
            {/* Separator: minus */}
            <tr className="bg-white">
              <td className="px-3 py-1 border border-slate-200" />
              {prices.map((_, i) => (
                <td key={i} className="px-2 py-1 text-center border border-slate-200 text-slate-400 font-mono">−</td>
              ))}
            </tr>
            {/* Market prices row */}
            <tr className="bg-blue-50">
              <td className="px-3 py-2 font-semibold text-slate-700 border border-slate-200 whitespace-nowrap">
                Posibles precios<br />
                <span className="font-normal text-slate-500">de mercado</span>
              </td>
              {prices.map((p, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 text-center border border-slate-200 font-mono ${Math.abs(p - strike) < 0.001 ? "bg-blue-200 font-bold text-blue-900" : "text-slate-700"}`}
                >
                  {fmt(p)}
                </td>
              ))}
            </tr>
            {/* Separator: equals */}
            <tr className="bg-white">
              <td className="px-3 py-1 border border-slate-200" />
              {prices.map((_, i) => (
                <td key={i} className="px-2 py-1 text-center border border-slate-200 text-slate-400 font-mono">=</td>
              ))}
            </tr>
            {/* Result row */}
            <tr className="bg-white">
              <td className="px-3 py-2 font-bold text-slate-700 border border-slate-200">Resultado</td>
              {results.map((r, i) => (
                <td
                  key={i}
                  className={`px-2 py-2 text-center border font-bold font-mono ${
                    r > 0
                      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                      : r < 0
                      ? "text-red-700 bg-red-50 border-red-200"
                      : "text-slate-600 bg-slate-100 border-slate-200"
                  }`}
                >
                  {r > 0 ? "+" : ""}{fmt(r)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Payoff chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
          Gráfica del perfil de pagos — Posición {position === "long" ? "Larga (compra)" : "Corta (venta)"}
        </p>
        <PayoffLineChart
          prices={prices}
          results={results}
          strike={strike}
          days={days}
          position={position}
        />
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Área verde = ganancia · Área roja = pérdida · Línea azul = SP ({fmt(strike)}) · Línea amarilla = punto de equilibrio
        </p>
      </div>
    </div>
  );
}

// ── IPC coverage table ──────────────────────────────────────────────────────
function IpcCoverageTable({ values }: { values: CalculationInput }) {
  const ipcSpot = Number(values.ipcSpot) || 50000;
  const riskFreeRate = Number(values.riskFreeRate) || 0.055;
  const days = Number(values.days) || 91;
  const portfolioValue = Number(values.portfolioValue) || 1000000;
  const multiplier = Number(values.multiplier) || 10;
  const spotAtMaturity = Number(values.spotAtMaturity) || 0;
  const F = ipcSpot * (1 + riskFreeRate * days / 360);
  const contracts = Math.ceil(portfolioValue / (F * multiplier));
  const spots = scenarios9(ipcSpot);
  const highlightIdx = spotAtMaturity > 0 ? closestIndex(spots, spotAtMaturity) : -1;
  const rows = spots.map((s) => ({
    s,
    futuresResult: contracts * (F - s) * multiplier,
    portfolioResult: portfolioValue * (s / ipcSpot - 1),
    get total() { return this.futuresResult + this.portfolioResult; },
  }));
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">F = {fmt(F)} · Contratos = {contracts} · Multiplicador = {multiplier}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              {["Precio Spot Vto.", "Resultado Futuros", "Resultado Portafolio", "Total Neto"].map(h => (
                <th key={h} className="px-3 py-2 font-semibold text-slate-700 border border-slate-200 text-right first:text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === highlightIdx ? "bg-blue-100 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-2 border border-slate-200">{fmt(row.s)}{i === highlightIdx && <span className="ml-2 text-xs text-brand font-bold">← actual</span>}</td>
                <td className={`px-3 py-2 border border-slate-200 text-right ${row.futuresResult >= 0 ? "text-emerald-700" : "text-red-700"}`}>{row.futuresResult >= 0 ? "+" : ""}{fmt(row.futuresResult)}</td>
                <td className={`px-3 py-2 border border-slate-200 text-right ${row.portfolioResult >= 0 ? "text-emerald-700" : "text-red-700"}`}>{row.portfolioResult >= 0 ? "+" : ""}{fmt(row.portfolioResult)}</td>
                <td className={`px-3 py-2 border border-slate-200 text-right font-semibold ${row.total >= 0 ? "text-emerald-700" : "text-red-700"}`}>{row.total >= 0 ? "+" : ""}{fmt(row.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Stock future coverage table ─────────────────────────────────────────────
function StockFutureCoverageTable({ values }: { values: CalculationInput }) {
  const spot = Number(values.spot) || 21.82;
  const desiredYield = Number(values.desiredYield) || 0.05;
  const days = Number(values.days) || 241;
  const shares = Number(values.shares) || 5000;
  const sharesPerContract = Number(values.sharesPerContract) || 100;
  const spotAtMaturity = Number(values.spotAtMaturity) || 0;
  const theoreticalPrice = spot * (1 + desiredYield * days / 360);
  const contracts = Math.round(shares / sharesPerContract);
  const spots = scenarios9(spot);
  const highlightIdx = spotAtMaturity > 0 ? closestIndex(spots, spotAtMaturity) : -1;
  const rows = spots.map((s) => {
    const futuresResult = contracts * sharesPerContract * (theoreticalPrice - s);
    const valorAcciones = shares * s;
    const total = valorAcciones + futuresResult;
    return { s, futuresResult, valorAcciones, total, rendimiento: (total - shares * spot) / (shares * spot) };
  });
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">F garantizado = {fmt(theoreticalPrice)} · Contratos = {contracts} · Acciones/contrato = {sharesPerContract}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              {["Precio Spot Vto.", "Resultado Futuros", "Valor Acciones", "Total Cubierto", "Rendimiento"].map(h => (
                <th key={h} className="px-3 py-2 font-semibold text-slate-700 border border-slate-200 text-right first:text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === highlightIdx ? "bg-blue-100 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-2 border border-slate-200">{fmt(row.s)}{i === highlightIdx && <span className="ml-2 text-xs text-brand font-bold">← actual</span>}</td>
                <td className={`px-3 py-2 border border-slate-200 text-right ${row.futuresResult >= 0 ? "text-emerald-700" : "text-red-700"}`}>{row.futuresResult >= 0 ? "+" : ""}{fmt(row.futuresResult)}</td>
                <td className="px-3 py-2 border border-slate-200 text-right">{fmt(row.valorAcciones)}</td>
                <td className="px-3 py-2 border border-slate-200 text-right font-semibold">{fmt(row.total)}</td>
                <td className={`px-3 py-2 border border-slate-200 text-right font-semibold ${row.rendimiento >= 0 ? "text-emerald-700" : "text-red-700"}`}>{fmtPct(row.rendimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Commodity coverage table ────────────────────────────────────────────────
function CommodityCoverageTable({ values }: { values: CalculationInput }) {
  const spot = Number(values.spot) || 59;
  const riskFreeRate = Number(values.riskFreeRate) || 0.0681;
  const days = Number(values.days) || 120;
  const units = Number(values.units) || 30000;
  const spotAtMaturity = Number(values.spotAtMaturity) || 0;
  const F = spot * (1 + riskFreeRate * days / 360);
  const costoFuturo = units * F;
  const spots = scenarios9(spot);
  const highlightIdx = spotAtMaturity > 0 ? closestIndex(spots, spotAtMaturity) : -1;
  const rows = spots.map((s) => ({ s, costoFuturo, costoSpot: units * s, ahorro: units * s - costoFuturo }));
  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">F = {fmt(F)} · Costo fijado = {fmt(costoFuturo)} · Unidades = {units.toLocaleString("es-MX")}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              {["Precio Spot Vto.", "Costo con Futuro", "Costo sin Futuro", "Ahorro / Pérdida"].map(h => (
                <th key={h} className="px-3 py-2 font-semibold text-slate-700 border border-slate-200 text-right first:text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i === highlightIdx ? "bg-blue-100 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                <td className="px-3 py-2 border border-slate-200">{fmt(row.s)}{i === highlightIdx && <span className="ml-2 text-xs text-brand font-bold">← actual</span>}</td>
                <td className="px-3 py-2 border border-slate-200 text-right">{fmt(row.costoFuturo)}</td>
                <td className="px-3 py-2 border border-slate-200 text-right">{fmt(row.costoSpot)}</td>
                <td className={`px-3 py-2 border border-slate-200 text-right font-semibold ${row.ahorro >= 0 ? "text-emerald-700" : "text-red-700"}`}>{row.ahorro >= 0 ? "+" : ""}{fmt(row.ahorro)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────
export function PayoffTable({ topicId, values, result }: Props) {
  const titles: Record<string, string> = {
    ipc_coverage: "Escenarios de cobertura — IPC",
    stock_future_coverage: "Escenarios de cobertura — Acciones",
    commodity_coverage: "Escenarios de cobertura — Commodity",
    stock_future: "Perfil de pagos del futuro",
  };
  if (!titles[topicId]) return null;

  const isStockFuture = topicId === "stock_future";
  const theoreticalPrice = isStockFuture
    ? (result?.results?.futurePrice as number) ?? Number(values.spot) ?? 0
    : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="text-base font-bold text-ink mb-1">{titles[topicId]}</h3>
      <p className="text-xs text-slate-500 mb-4">
        {isStockFuture
          ? "Strike = precio futuro teórico calculado. Paso configurable con el campo 'Paso del perfil'."
          : "Tabla con 9 escenarios: 80% a 120% del precio base."}
      </p>
      {topicId === "ipc_coverage" && <IpcCoverageTable values={values} />}
      {topicId === "stock_future_coverage" && <StockFutureCoverageTable values={values} />}
      {topicId === "commodity_coverage" && <CommodityCoverageTable values={values} />}
      {topicId === "stock_future" && theoreticalPrice > 0 && (
        <StockFuturePayoffTable values={values} theoreticalPrice={theoreticalPrice} />
      )}
    </section>
  );
}
