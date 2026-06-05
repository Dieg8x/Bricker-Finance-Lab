import type { ResultMetric } from "../lib/types";
import { formatMoney, formatNumber, formatPercent } from "../lib/formatters";

function renderMetric(metric: ResultMetric): string {
  if (typeof metric.value === "string") return metric.value;
  if (metric.unit === "$") return formatMoney(metric.value);
  if (metric.unit === "%") return formatPercent(metric.value);
  return `${formatNumber(metric.value, Math.abs(metric.value) >= 100 ? 2 : 4)}${metric.unit && metric.unit !== "$" ? ` ${metric.unit}` : ""}`;
}

interface Props {
  metric: ResultMetric;
}

export function ResultCard({ metric }: Props) {
  return (
    <div className={`rounded-lg border p-4 ${metric.emphasis ? "border-brand bg-blue-50" : "border-slate-200 bg-white"}`}>
      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{metric.label}</p>
      <p className="mt-2 break-words text-2xl font-bold text-ink">{renderMetric(metric)}</p>
    </div>
  );
}
