import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatPercent, normalizeRate, round } from "../formatters";
import { compactWarnings, requirePositive, requireRate } from "../validation";

export function calculateWiredRate(input: CalculationInput): CalculationResult {
  const longDays = asNumber(input.longDays);
  const shortDays = asNumber(input.shortDays);
  const desiredDays = asNumber(input.desiredDays);
  const longRate = normalizeRate(input.longRate);
  const shortRate = normalizeRate(input.shortRate);
  const wiredRate = (Math.pow(
    (1 + longRate * longDays / 360) / (1 + shortRate * shortDays / 360),
    (desiredDays - shortDays) / (longDays - shortDays),
  ) * (1 + shortRate * shortDays / 360) - 1) * (360 / desiredDays);
  const warnings = compactWarnings([
    requirePositive(longDays, "el plazo largo"),
    requirePositive(shortDays, "el plazo corto"),
    requirePositive(desiredDays, "el plazo deseado"),
    longDays <= shortDays ? "Revisa los plazos. El largo debe ser mayor que el corto." : null,
    desiredDays < shortDays || desiredDays > longDays ? "El plazo deseado está fuera del rango corto-largo." : null,
    requireRate(input.longRate, "la tasa larga"),
    requireRate(input.shortRate, "la tasa corta"),
  ]);

  return {
    results: { wiredRate: round(wiredRate, 6) },
    metrics: [{ key: "wiredRate", label: "Tasa alambrada", value: wiredRate, unit: "%", emphasis: true }],
    formula: "Tasa alambrada = interpolación compuesta entre tasa corta y larga",
    steps: [
      "Se calcula la tasa implícita para un plazo que no tiene cotización directa.",
      `Tasa = ${formatPercent(wiredRate)} para ${desiredDays} días`,
    ],
    interpretation: `La tasa estimada para ${desiredDays} días es ${formatPercent(wiredRate)}.`,
    examExplanation: "Ubicamos el plazo deseado entre el plazo corto y largo, y usamos una interpolación compuesta para obtener la tasa implícita.",
    warnings,
  };
}
