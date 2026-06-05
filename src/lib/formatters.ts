export function asNumber(value: number | string): number {
  if (typeof value === "number") return value;
  const parsed = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function normalizeRate(value: number | string): number {
  const numeric = asNumber(value);
  if (!Number.isFinite(numeric)) return Number.NaN;
  return Math.abs(numeric) > 1 ? numeric / 100 : numeric;
}

export function formatMoney(value: number, currency = "$"): string {
  return `${currency}${value.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(value: number, decimals = 4): string {
  return value.toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 4): string {
  return `${(value * 100).toLocaleString("es-MX", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function round(value: number, decimals = 6): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}
