import { asNumber, normalizeRate } from "./formatters";

export function requirePositive(value: number | string, label: string): string | null {
  const numeric = asNumber(value);
  if (!Number.isFinite(numeric)) return `Revisa ${label}. Debe ser un número.`;
  if (numeric <= 0) return `Revisa ${label}. No puede ser menor o igual a 0.`;
  return null;
}

export function requireNonNegative(value: number | string, label: string): string | null {
  const numeric = asNumber(value);
  if (!Number.isFinite(numeric)) return `Revisa ${label}. Debe ser un número.`;
  if (numeric < 0) return `Revisa ${label}. No puede ser negativo.`;
  return null;
}

export function requireRate(value: number | string, label: string): string | null {
  const rate = normalizeRate(value);
  if (!Number.isFinite(rate)) return `Revisa ${label}. Debe ser una tasa válida.`;
  if (rate < -1 || rate > 1) return `Revisa ${label}. La tasa parece absurda para el ejercicio.`;
  return null;
}

export function compactWarnings(warnings: Array<string | null>): string[] {
  return warnings.filter((warning): warning is string => Boolean(warning));
}
