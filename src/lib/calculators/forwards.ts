import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatNumber, formatPercent, normalizeRate, round } from "../formatters";
import { compactWarnings, requirePositive, requireRate } from "../validation";

export function calculateForwardFX(input: CalculationInput): CalculationResult {
  const days = asNumber(input.days);
  const spotBuy = asNumber(input.spotBuy);
  const spotSell = asNumber(input.spotSell);
  const domesticPassive = normalizeRate(input.domesticPassive);
  const domesticActive = normalizeRate(input.domesticActive);
  const foreignPassive = normalizeRate(input.foreignPassive);
  const foreignActive = normalizeRate(input.foreignActive);

  const buyForward = spotBuy * ((1 + domesticPassive * days / 360) / (1 + foreignActive * days / 360));
  const sellForward = spotSell * ((1 + domesticActive * days / 360) / (1 + foreignPassive * days / 360));
  const warnings = compactWarnings([
    requirePositive(days, "el plazo"),
    requirePositive(spotBuy, "el spot compra"),
    requirePositive(spotSell, "el spot venta"),
    requireRate(input.domesticPassive, "la tasa pasiva nacional"),
    requireRate(input.domesticActive, "la tasa activa nacional"),
    requireRate(input.foreignPassive, "la tasa pasiva extranjera"),
    requireRate(input.foreignActive, "la tasa activa extranjera"),
  ]);

  return {
    results: { buyForward: round(buyForward, 4), sellForward: round(sellForward, 4) },
    metrics: [
      { key: "buyForward", label: "Forward compra", value: buyForward, unit: "MXN/USD", emphasis: true },
      { key: "sellForward", label: "Forward venta", value: sellForward, unit: "MXN/USD", emphasis: true },
    ],
    formula: "Forward = Spot × [(1 + tasa doméstica × d/360) / (1 + tasa extranjera × d/360)]",
    steps: [
      `Compra = ${formatNumber(spotBuy, 4)} × [(1 + ${formatPercent(domesticPassive)} × ${days}/360) / (1 + ${formatPercent(foreignActive)} × ${days}/360)] = ${formatNumber(buyForward, 4)}`,
      `Venta = ${formatNumber(spotSell, 4)} × [(1 + ${formatPercent(domesticActive)} × ${days}/360) / (1 + ${formatPercent(foreignPassive)} × ${days}/360)] = ${formatNumber(sellForward, 4)}`,
    ],
    interpretation: `El tipo de cambio forward estimado sería ${formatNumber(buyForward, 4)} compra y ${formatNumber(sellForward, 4)} venta.`,
    examExplanation: "Se ajusta el spot por el diferencial de tasas entre moneda nacional y extranjera durante el plazo del contrato.",
    warnings,
  };
}

export function calculateForwardRate(input: CalculationInput): CalculationResult {
  const shortDays = asNumber(input.shortDays);
  const longDays = asNumber(input.longDays);
  const shortRate = normalizeRate(input.shortRate);
  const longRate = normalizeRate(input.longRate);
  const forwardRate = (((1 + longRate * longDays / 360) / (1 + shortRate * shortDays / 360)) - 1) * (360 / (longDays - shortDays));
  const warnings = compactWarnings([
    requirePositive(shortDays, "el plazo corto"),
    requirePositive(longDays, "el plazo largo"),
    longDays <= shortDays ? "Revisa los plazos. El plazo largo debe ser mayor al plazo corto." : null,
    requireRate(input.shortRate, "la tasa corta"),
    requireRate(input.longRate, "la tasa larga"),
  ]);

  return {
    results: { forwardRate: round(forwardRate, 6) },
    metrics: [{ key: "forwardRate", label: "Tasa forward", value: forwardRate, unit: "%", emphasis: true }],
    formula: "f = [((1+rL×tL/360)/(1+rC×tC/360))-1] × [360/(tL-tC)]",
    steps: [
      `f = [((1 + ${formatPercent(longRate)} × ${longDays}/360) / (1 + ${formatPercent(shortRate)} × ${shortDays}/360)) - 1] × [360 / (${longDays}-${shortDays})]`,
      `f = ${formatPercent(forwardRate)}`,
    ],
    interpretation: `La tasa implícita entre ${shortDays} y ${longDays} días es ${formatPercent(forwardRate)}.`,
    examExplanation: "Comparamos el rendimiento acumulado al plazo largo contra el rendimiento acumulado al plazo corto y anualizamos el tramo restante.",
    warnings,
  };
}
