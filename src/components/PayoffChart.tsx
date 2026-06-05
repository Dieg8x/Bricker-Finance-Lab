import { useMemo } from "react";
import type { CalculationInput } from "../lib/types";

interface Props {
  topicId: string;
  values: CalculationInput;
}

export function PayoffChart({ topicId, values }: Props) {
  const strike = Number(values.strike) || Number(values.strike1) || 100;
  const strike2 = Number(values.strike2) || strike;
  const spotFinal = Number(values.spot) || strike;

  const data = useMemo(() => {
    const points = [];
    const minSpot = Math.min(strike, strike2) * 0.5;
    const maxSpot = Math.max(strike, strike2) * 1.5;
    const step = (maxSpot - minSpot) / 50;

    for (let x = minSpot; x <= maxSpot; x += step) {
      if (topicId === "payoff_without_premium") {
        points.push({
          spot: x,
          "Forward Largo": x - strike,
          "Forward Corto": strike - x,
        });
      } else if (topicId === "option_strategies") {
        const strategy = String(values.strategy);
        const k1 = Number(values.strike1) || 100;
        const k2 = Number(values.strike2) || 110;
        const p1 = Number(values.premium1) || 0;
        const p2 = Number(values.premium2) || 0;
        
        let payoff = 0;
        if (strategy === "bull_spread_call") {
          payoff = Math.max(x - k1, 0) - Math.max(x - k2, 0) - (p1 - p2);
        } else if (strategy === "bear_spread_put") {
          payoff = Math.max(k2 - x, 0) - Math.max(k1 - x, 0) - (p2 - p1);
        } else if (strategy === "straddle") {
          payoff = Math.max(x - k1, 0) + Math.max(k1 - x, 0) - (p1 + p2);
        } else if (strategy === "strangle") {
          payoff = Math.max(k1 - x, 0) + Math.max(x - k2, 0) - (p1 + p2);
        }
        points.push({ spot: x, "Estrategia": payoff });
      } else {
        const callP = Number(values.callPremium) || 0;
        const putP = Number(values.putPremium) || 0;
        points.push({
          spot: x,
          "Call Comprado": Math.max(x - strike, 0) - callP,
          "Put Comprado": Math.max(strike - x, 0) - putP,
          "Call Vendido": callP - Math.max(x - strike, 0),
          "Put Vendido": putP - Math.max(strike - x, 0),
        });
      }
    }
    return points;
  }, [topicId, strike, strike2, values]);

  // Find min/max for scaling
  const allValues = data.flatMap((d) => {
    const vals = Object.values(d).slice(1) as number[];
    return vals;
  });
  const maxPayoff = Math.max(...allValues, 10);
  const minPayoff = Math.min(...allValues, -10);
  
  // Padding
  const domainMax = maxPayoff * 1.1;
  const domainMin = minPayoff * 1.1;

  // SVG dimensions
  const width = 600;
  const height = 300;
  const margin = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Scale functions
  const minSpot = Math.min(strike, strike2) * 0.5;
  const maxSpot = Math.max(strike, strike2) * 1.5;
  const xScale = (x: number) => ((x - minSpot) / (maxSpot - minSpot)) * innerWidth;
  const yScale = (y: number) => innerHeight - ((y - domainMin) / (domainMax - domainMin)) * innerHeight;

  // Zero line (x-axis)
  const zeroY = yScale(0);

  const seriesColors = {
    "Forward Largo": "#10b981", // emerald-500
    "Forward Corto": "#f43f5e", // rose-500
    "Call Comprado": "#3b82f6", // blue-500
    "Put Comprado": "#8b5cf6", // violet-500
    "Call Vendido": "#f59e0b", // amber-500
    "Put Vendido": "#06b6d4", // cyan-500
    "Estrategia": "#8b5cf6", // violet-500
  };

  const seriesKeys = Object.keys(data[0]).filter((k) => k !== "spot");

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm no-print">
      <h3 className="text-base font-bold text-ink mb-4">Gráfico de Perfil de Pago (Payoff)</h3>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto min-w-[500px]" style={{ maxHeight: "350px" }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid & Zero lines */}
            <line x1={0} x2={innerWidth} y1={zeroY} y2={zeroY} stroke="#cbd5e1" strokeWidth="2" />
            <line x1={xScale(strike)} x2={xScale(strike)} y1={0} y2={innerHeight} stroke="#94a3b8" strokeDasharray="4 4" />
            <text x={xScale(strike)} y={innerHeight + 20} fontSize="12" textAnchor="middle" fill="#64748b">
              K1 ({strike})
            </text>
            {topicId === "option_strategies" && strike2 !== strike && (
              <>
                <line x1={xScale(strike2)} x2={xScale(strike2)} y1={0} y2={innerHeight} stroke="#94a3b8" strokeDasharray="4 4" />
                <text x={xScale(strike2)} y={innerHeight + 20} fontSize="12" textAnchor="middle" fill="#64748b">
                  K2 ({strike2})
                </text>
              </>
            )}

            {/* Current Spot Indicator */}
            {spotFinal >= minSpot && spotFinal <= maxSpot && (
              <>
                <line x1={xScale(spotFinal)} x2={xScale(spotFinal)} y1={0} y2={innerHeight} stroke="#0ea5e9" strokeWidth="2" opacity="0.5" />
                <circle cx={xScale(spotFinal)} cy={zeroY} r="4" fill="#0ea5e9" />
                <text x={xScale(spotFinal)} y={-5} fontSize="12" textAnchor="middle" fill="#0ea5e9" fontWeight="bold">
                  Spot ({spotFinal})
                </text>
              </>
            )}

            {/* Y Axis labels */}
            <text x="-10" y={yScale(domainMax)} fontSize="11" textAnchor="end" fill="#64748b" alignmentBaseline="middle">
              {domainMax.toFixed(0)}
            </text>
            <text x="-10" y={yScale(domainMin)} fontSize="11" textAnchor="end" fill="#64748b" alignmentBaseline="middle">
              {domainMin.toFixed(0)}
            </text>

            {/* Lines */}
            {seriesKeys.map((key) => {
              const pathD = data
                .map((d, i) => `${i === 0 ? "M" : "L"} ${xScale(d.spot)} ${yScale(d[key as keyof typeof d] as number)}`)
                .join(" ");
              return (
                <path
                  key={key}
                  d={pathD}
                  fill="none"
                  stroke={seriesColors[key as keyof typeof seriesColors] || "#333"}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}
          </g>
        </svg>
      </div>
      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        {seriesKeys.map((key) => (
          <div key={key} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: seriesColors[key as keyof typeof seriesColors] }} />
            <span className="text-sm font-medium text-slate-700">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
