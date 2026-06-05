import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, formatPercent, normalizeRate, round } from "../formatters";
import { compactWarnings, requirePositive, requireRate } from "../validation";

export function calculateFRA(input: CalculationInput): CalculationResult {
  const notional = asNumber(input.notional);
  const agreedRate = normalizeRate(input.agreedRate);
  const marketRate = normalizeRate(input.marketRate);
  const days = asNumber(input.days);
  const base = asNumber(input.base);
  const settlement = (notional * (marketRate - agreedRate) * (days / base)) / (1 + marketRate * (days / base));
  const warnings = compactWarnings([
    requirePositive(notional, "el monto nocional"),
    requireRate(input.agreedRate, "la tasa pactada"),
    requireRate(input.marketRate, "la tasa de mercado"),
    requirePositive(days, "el plazo"),
    requirePositive(base, "la base de días"),
  ]);

  return {
    results: { settlement: round(settlement, 4), rateDifference: round(marketRate - agreedRate, 6) },
    metrics: [
      { key: "settlement", label: "Liquidación FRA", value: settlement, unit: "$", emphasis: true },
      { key: "rateDifference", label: "Diferencial de tasas", value: marketRate - agreedRate, unit: "%" },
    ],
    formula: "Liquidación = [N × (r mercado - r pactada) × d/base] / [1 + r mercado × d/base]",
    steps: [
      `Diferencial = ${formatPercent(marketRate)} - ${formatPercent(agreedRate)} = ${formatPercent(marketRate - agreedRate)}`,
      `Liquidación = [${formatMoney(notional)} × diferencial × ${days}/${base}] / [1 + ${formatPercent(marketRate)} × ${days}/${base}]`,
      `Liquidación = ${formatMoney(settlement)}`,
    ],
    interpretation: settlement >= 0
      ? `La liquidación estimada es a favor del comprador del FRA por ${formatMoney(settlement)}.`
      : `La liquidación estimada es en contra del comprador del FRA por ${formatMoney(Math.abs(settlement))}.`,
    examExplanation: "Comparamos la tasa de mercado contra la pactada, aplicamos el plazo sobre la base de días y descontamos el pago al inicio del periodo.",
    warnings,
  };
}
