import type { CalculationInput } from "../lib/types";

interface Props {
  topicId: string;
  values: CalculationInput;
}

function fmt(n: number): string {
  return n.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n: number): string {
  return (n * 100).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";
}

function scenarios(base: number): number[] {
  return [0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20].map((f) => base * f);
}

function closestIndex(arr: number[], target: number): number {
  let idx = 0;
  let minDiff = Math.abs(arr[0] - target);
  for (let i = 1; i < arr.length; i++) {
    const diff = Math.abs(arr[i] - target);
    if (diff < minDiff) {
      minDiff = diff;
      idx = i;
    }
  }
  return idx;
}

function IpcCoverageTable({ values }: { values: CalculationInput }) {
  const ipcSpot = Number(values.ipcSpot) || 50000;
  const riskFreeRate = Number(values.riskFreeRate) || 0.055;
  const days = Number(values.days) || 91;
  const portfolioValue = Number(values.portfolioValue) || 1000000;
  const multiplier = Number(values.multiplier) || 10;
  const spotAtMaturity = Number(values.spotAtMaturity) || 0;

  const F = ipcSpot * (1 + riskFreeRate * days / 360);
  const contracts = Math.ceil(portfolioValue / (F * multiplier));
  const spots = scenarios(ipcSpot);

  const highlightIdx = spotAtMaturity > 0 ? closestIndex(spots, spotAtMaturity) : -1;

  const rows = spots.map((s) => {
    const futuresResult = contracts * (F - s) * multiplier;
    const portfolioResult = portfolioValue * (s / ipcSpot - 1);
    const total = futuresResult + portfolioResult;
    return { s, futuresResult, portfolioResult, total };
  });

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">
        F = {fmt(F)} | Contratos = {contracts} | Multiplicador = {multiplier}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Precio Spot al Vencimiento</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Resultado Futuros</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Resultado Portafolio</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Total Neto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={i === highlightIdx ? "bg-blue-100 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="px-3 py-2 border border-slate-200 text-slate-800">
                  {fmt(row.s)}
                  {i === highlightIdx && <span className="ml-2 text-xs text-brand font-bold">← seleccionado</span>}
                </td>
                <td className={`px-3 py-2 border border-slate-200 text-right ${row.futuresResult >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {row.futuresResult >= 0 ? "+" : ""}{fmt(row.futuresResult)}
                </td>
                <td className={`px-3 py-2 border border-slate-200 text-right ${row.portfolioResult >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {row.portfolioResult >= 0 ? "+" : ""}{fmt(row.portfolioResult)}
                </td>
                <td className={`px-3 py-2 border border-slate-200 text-right font-semibold ${row.total >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {row.total >= 0 ? "+" : ""}{fmt(row.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockFutureCoverageTable({ values }: { values: CalculationInput }) {
  const spot = Number(values.spot) || 21.82;
  const desiredYield = Number(values.desiredYield) || 0.05;
  const days = Number(values.days) || 241;
  const shares = Number(values.shares) || 5000;
  const sharesPerContract = Number(values.sharesPerContract) || 100;
  const spotAtMaturity = Number(values.spotAtMaturity) || 0;

  const theoreticalPrice = spot * (1 + desiredYield * days / 360);
  const contracts = Math.round(shares / sharesPerContract);
  const spots = scenarios(spot);

  const highlightIdx = spotAtMaturity > 0 ? closestIndex(spots, spotAtMaturity) : -1;

  const rows = spots.map((s) => {
    const futuresResult = contracts * sharesPerContract * (theoreticalPrice - s);
    const valorAcciones = shares * s;
    const total = valorAcciones + futuresResult;
    const rendimiento = (total - shares * spot) / (shares * spot);
    return { s, futuresResult, valorAcciones, total, rendimiento };
  });

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">
        F garantizado = {fmt(theoreticalPrice)} | Contratos = {contracts} | Acciones/contrato = {sharesPerContract}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Precio Spot Vto.</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Resultado Futuros</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Valor Acciones</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Total Cubierto</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Rendimiento</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={i === highlightIdx ? "bg-blue-100 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="px-3 py-2 border border-slate-200 text-slate-800">
                  {fmt(row.s)}
                  {i === highlightIdx && <span className="ml-2 text-xs text-brand font-bold">← seleccionado</span>}
                </td>
                <td className={`px-3 py-2 border border-slate-200 text-right ${row.futuresResult >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {row.futuresResult >= 0 ? "+" : ""}{fmt(row.futuresResult)}
                </td>
                <td className="px-3 py-2 border border-slate-200 text-right text-slate-800">
                  {fmt(row.valorAcciones)}
                </td>
                <td className="px-3 py-2 border border-slate-200 text-right font-semibold text-slate-800">
                  {fmt(row.total)}
                </td>
                <td className={`px-3 py-2 border border-slate-200 text-right font-semibold ${row.rendimiento >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {fmtPct(row.rendimiento)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CommodityCoverageTable({ values }: { values: CalculationInput }) {
  const spot = Number(values.spot) || 59;
  const riskFreeRate = Number(values.riskFreeRate) || 0.0681;
  const days = Number(values.days) || 120;
  const units = Number(values.units) || 30000;
  const spotAtMaturity = Number(values.spotAtMaturity) || 0;

  const F = spot * (1 + riskFreeRate * days / 360);
  const costoFuturo = units * F;
  const spots = scenarios(spot);

  const highlightIdx = spotAtMaturity > 0 ? closestIndex(spots, spotAtMaturity) : -1;

  const rows = spots.map((s) => {
    const costoSpot = units * s;
    const ahorro = costoSpot - costoFuturo;
    return { s, costoFuturo, costoSpot, ahorro };
  });

  return (
    <div>
      <p className="text-xs text-slate-500 mb-2">
        F teórico = {fmt(F)} | Costo fijado = {fmt(costoFuturo)} | Unidades = {units.toLocaleString("es-MX")}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left px-3 py-2 font-semibold text-slate-700 border border-slate-200">Precio Spot Vto.</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Costo con Futuro</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Costo sin Futuro (Spot)</th>
              <th className="text-right px-3 py-2 font-semibold text-slate-700 border border-slate-200">Ahorro / Pérdida</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={i === highlightIdx ? "bg-blue-100 font-semibold" : i % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="px-3 py-2 border border-slate-200 text-slate-800">
                  {fmt(row.s)}
                  {i === highlightIdx && <span className="ml-2 text-xs text-brand font-bold">← seleccionado</span>}
                </td>
                <td className="px-3 py-2 border border-slate-200 text-right text-slate-800">
                  {fmt(row.costoFuturo)}
                </td>
                <td className="px-3 py-2 border border-slate-200 text-right text-slate-800">
                  {fmt(row.costoSpot)}
                </td>
                <td className={`px-3 py-2 border border-slate-200 text-right font-semibold ${row.ahorro >= 0 ? "text-emerald-700" : "text-red-700"}`}>
                  {row.ahorro >= 0 ? "+" : ""}{fmt(row.ahorro)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function PayoffTable({ topicId, values }: Props) {
  const coverageTopics = ["ipc_coverage", "stock_future_coverage", "commodity_coverage"];
  if (!coverageTopics.includes(topicId)) return null;

  const titles: Record<string, string> = {
    ipc_coverage: "Escenarios de cobertura — IPC",
    stock_future_coverage: "Escenarios de cobertura — Acciones",
    commodity_coverage: "Escenarios de cobertura — Commodity",
  };

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft">
      <h3 className="text-base font-bold text-ink mb-1">{titles[topicId]}</h3>
      <p className="text-xs text-slate-500 mb-4">Tabla de 9 escenarios: 80% a 120% del precio base.</p>
      {topicId === "ipc_coverage" && <IpcCoverageTable values={values} />}
      {topicId === "stock_future_coverage" && <StockFutureCoverageTable values={values} />}
      {topicId === "commodity_coverage" && <CommodityCoverageTable values={values} />}
    </section>
  );
}
