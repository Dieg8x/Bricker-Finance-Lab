import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, formatPercent, normalizeRate, round } from "../formatters";
import { compactWarnings, requirePositive, requireRate } from "../validation";

export function calculateSimpleSwap(input: CalculationInput): CalculationResult {
  const notional = asNumber(input.notional);
  const fixedRate = normalizeRate(input.fixedRate);
  const variableRate = normalizeRate(input.variableRate);
  const spread = normalizeRate(input.spread);
  const frequency = asNumber(input.frequency);
  const periods = asNumber(input.periods);
  const discountRate = normalizeRate(input.discountRate);
  const position = String(input.position);
  const variableTotal = variableRate + spread;
  const fixedPayment = notional * fixedRate / frequency;
  const variablePayment = notional * variableTotal / frequency;
  const netFlow = position === "payFixed" ? variablePayment - fixedPayment : fixedPayment - variablePayment;
  const pvFactor = 1 + discountRate / frequency;
  const vpn = Array.from({ length: Math.max(0, Math.round(periods)) }, (_, index) => netFlow / (pvFactor ** (index + 1))).reduce((sum, value) => sum + value, 0);
  const status = vpn > 0 ? "Favorable" : vpn < 0 ? "Desfavorable" : "Neutro";
  const warnings = compactWarnings([
    requirePositive(notional, "el nocional"),
    requireRate(input.fixedRate, "la tasa fija"),
    requireRate(input.variableRate, "la tasa variable"),
    requireRate(input.spread, "el spread"),
    requirePositive(frequency, "la frecuencia"),
    requirePositive(periods, "los periodos"),
    requireRate(input.discountRate, "la tasa de descuento"),
  ]);

  return {
    results: {
      variableTotal: round(variableTotal, 6),
      fixedPayment: round(fixedPayment, 4),
      variablePayment: round(variablePayment, 4),
      netFlow: round(netFlow, 4),
      vpn: round(vpn, 4),
      status,
    },
    metrics: [
      { key: "vpn", label: "VPN del swap", value: vpn, unit: "$", emphasis: true },
      { key: "status", label: "Estado", value: status, emphasis: true },
      { key: "fixedPayment", label: "Pago fijo / periodo", value: fixedPayment, unit: "$" },
      { key: "variablePayment", label: "Pago variable / periodo", value: variablePayment, unit: "$" },
      { key: "netFlow", label: "Flujo neto / periodo", value: netFlow, unit: "$" },
      { key: "variableTotal", label: "Tasa variable total", value: variableTotal, unit: "%" },
    ],
    formula: "Pago fijo=Nocional×tasa fija/frecuencia; Pago variable=Nocional×tasa variable total/frecuencia; VPN=Σ flujo/(1+r/f)^t",
    steps: [
      `Tasa variable total = ${formatPercent(variableRate)} + ${formatPercent(spread)} = ${formatPercent(variableTotal)}`,
      `Pago fijo = ${formatMoney(notional)} × ${formatPercent(fixedRate)} / ${frequency} = ${formatMoney(fixedPayment)}`,
      `Pago variable = ${formatMoney(notional)} × ${formatPercent(variableTotal)} / ${frequency} = ${formatMoney(variablePayment)}`,
      `Flujo neto = ${position === "payFixed" ? "pago variable - pago fijo" : "pago fijo - pago variable"} = ${formatMoney(netFlow)}`,
      `VPN = suma de ${periods} flujos descontados a ${formatPercent(discountRate)} = ${formatMoney(vpn)}`,
    ],
    interpretation: `El swap es ${status.toLowerCase()} para la posición seleccionada porque el VPN es ${formatMoney(vpn)}.`,
    examExplanation: "Primero calculamos pagos fijo y variable por periodo. Luego elegimos el signo según qué pago recibes y qué pago haces. Finalmente descontamos los flujos para obtener el VPN.",
    warnings,
  };
}

export function calculateComparativeAdvantage(input: CalculationInput): CalculationResult {
  const fixedA = normalizeRate(input.fixedA);
  const variableA = normalizeRate(input.variableA);
  const fixedB = normalizeRate(input.fixedB);
  const variableB = normalizeRate(input.variableB);
  const bankCommission = normalizeRate(input.bankCommission);
  const fixedDiff = Math.abs(fixedA - fixedB);
  const variableDiff = Math.abs(variableA - variableB);
  const totalAdvantage = fixedDiff - variableDiff;
  const bankShare = Math.max(totalAdvantage * bankCommission, 0);
  const netBenefit = totalAdvantage - bankShare;
  const benefitPerCompany = netBenefit / 2;
  const warnings = compactWarnings([
    requireRate(input.fixedA, "la tasa fija de A"),
    requireRate(input.variableA, "la tasa variable de A"),
    requireRate(input.fixedB, "la tasa fija de B"),
    requireRate(input.variableB, "la tasa variable de B"),
    totalAdvantage <= 0 ? "No hay ventaja comparativa positiva con estos datos." : null,
  ]);

  return {
    results: { fixedDiff, variableDiff, totalAdvantage, bankShare, netBenefit, benefitPerCompany },
    metrics: [
      { key: "totalAdvantage", label: "Ventaja total", value: totalAdvantage, unit: "%", emphasis: true },
      { key: "netBenefit", label: "Beneficio neto", value: netBenefit, unit: "%", emphasis: true },
      { key: "benefitPerCompany", label: "Beneficio por empresa", value: benefitPerCompany, unit: "%" },
      { key: "bankShare", label: "Comisión banco", value: bankShare, unit: "%" },
    ],
    formula: "Ventaja total = |diferencial fijo| - |diferencial variable|",
    steps: [
      `Diferencial fijo = |${formatPercent(fixedA)} - ${formatPercent(fixedB)}| = ${formatPercent(fixedDiff)}`,
      `Diferencial variable = |${formatPercent(variableA)} - ${formatPercent(variableB)}| = ${formatPercent(variableDiff)}`,
      `Ventaja total = ${formatPercent(fixedDiff)} - ${formatPercent(variableDiff)} = ${formatPercent(totalAdvantage)}`,
      `Beneficio neto = ${formatPercent(totalAdvantage)} - comisión banco ${formatPercent(bankShare)} = ${formatPercent(netBenefit)}`,
    ],
    interpretation: totalAdvantage > 0
      ? `Existe ventaja comparativa de ${formatPercent(totalAdvantage)} antes de comisión.`
      : "Con estos datos no hay beneficio económico claro para repartir.",
    examExplanation: "Comparamos la diferencia de costos en tasa fija contra la diferencia en variable. La ventaja surge cuando la diferencia fija es mayor que la variable.",
    warnings,
  };
}
