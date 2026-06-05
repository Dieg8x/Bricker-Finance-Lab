import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, formatNumber, formatPercent, normalizeRate, round } from "../formatters";
import { compactWarnings, requireNonNegative, requirePositive, requireRate } from "../validation";

export function calculateSimpleFuture(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const days = asNumber(input.days);
  const rate = normalizeRate(input.riskFreeRate);
  const futurePrice = spot * (1 + rate * (days / 360));
  const difference = futurePrice - spot;
  const warnings = compactWarnings([
    requirePositive(spot, "el precio spot"),
    requirePositive(days, "el plazo"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
  ]);

  return {
    results: { futurePrice: round(futurePrice, 4), difference: round(difference, 4) },
    metrics: [
      { key: "futurePrice", label: "Precio futuro teórico", value: futurePrice, unit: "$", emphasis: true },
      { key: "difference", label: "Diferencia contra spot", value: difference, unit: "$" },
    ],
    formula: "F = S × (1 + r × d / 360)",
    steps: [
      "Se usa la fórmula de precio futuro simple con base de 360 días.",
      `F = ${formatMoney(spot)} × (1 + ${formatPercent(rate)} × ${days}/360)`,
      `F = ${formatMoney(futurePrice)}`,
      `Diferencia = ${formatMoney(futurePrice)} - ${formatMoney(spot)} = ${formatMoney(difference)}`,
    ],
    interpretation: `El precio justo futuro sería ${formatMoney(futurePrice)}. La diferencia contra el spot es ${formatMoney(difference)}.`,
    examExplanation: "Primero identificamos spot, tasa y plazo. Después capitalizamos el spot por la tasa libre de riesgo usando base de 360 días.",
    warnings,
  };
}

export function calculateCommodityFuture(input: CalculationInput): CalculationResult {
  return calculateSimpleFuture(input);
}

export function calculateStockFuture(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const days = asNumber(input.days);
  const rate = normalizeRate(input.riskFreeRate);
  const dividend = asNumber(input.dividend);
  const dividendDays = asNumber(input.dividendDays);
  const pvDividend = dividend / (1 + rate * (dividendDays / 360));
  const futurePrice = (spot - pvDividend) * (1 + rate * (days / 360));
  const warnings = compactWarnings([
    requirePositive(spot, "el precio spot"),
    requirePositive(days, "el plazo"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
    requireNonNegative(dividend, "el dividendo"),
    requireNonNegative(dividendDays, "los días al dividendo"),
  ]);

  return {
    results: { pvDividend: round(pvDividend, 4), futurePrice: round(futurePrice, 4) },
    metrics: [
      { key: "futurePrice", label: "Precio futuro de la acción", value: futurePrice, unit: "$", emphasis: true },
      { key: "pvDividend", label: "Valor presente del dividendo", value: pvDividend, unit: "$" },
    ],
    formula: "F = (S - VP(dividendo)) × (1 + r × d / 360)",
    steps: [
      `VP(dividendo) = ${formatMoney(dividend)} / (1 + ${formatPercent(rate)} × ${dividendDays}/360) = ${formatMoney(pvDividend)}`,
      `F = (${formatMoney(spot)} - ${formatMoney(pvDividend)}) × (1 + ${formatPercent(rate)} × ${days}/360)`,
      `F = ${formatMoney(futurePrice)}`,
    ],
    interpretation: `El precio futuro teórico de la acción sería ${formatMoney(futurePrice)} después de descontar el dividendo.`,
    examExplanation: "Primero traemos el dividendo a valor presente, se lo restamos al spot y luego capitalizamos al plazo del futuro.",
    warnings,
  };
}

export function calculateFutureContracts(input: CalculationInput): CalculationResult {
  const portfolioValue = asNumber(input.portfolioValue);
  const futurePrice = asNumber(input.futurePrice);
  const multiplier = asNumber(input.multiplier);
  const contractValue = futurePrice * multiplier;
  const contracts = portfolioValue / contractValue;
  const warnings = compactWarnings([
    requirePositive(portfolioValue, "el valor a cubrir"),
    requirePositive(futurePrice, "el precio futuro"),
    requirePositive(multiplier, "el multiplicador"),
  ]);

  return {
    results: { contractValue: round(contractValue, 4), contracts: round(contracts, 4) },
    metrics: [
      { key: "contracts", label: "Número de contratos", value: contracts, emphasis: true },
      { key: "contractValue", label: "Valor por contrato", value: contractValue, unit: "$" },
    ],
    formula: "Contratos = Valor a cubrir / (Precio futuro × multiplicador)",
    steps: [
      `Valor por contrato = ${formatNumber(futurePrice, 2)} × ${formatNumber(multiplier, 2)} = ${formatMoney(contractValue)}`,
      `Contratos = ${formatMoney(portfolioValue)} / ${formatMoney(contractValue)} = ${formatNumber(contracts, 4)}`,
    ],
    interpretation: `Se necesitarían aproximadamente ${formatNumber(contracts, 2)} contratos.`,
    examExplanation: "Calculamos cuánto vale un contrato y dividimos el valor que queremos cubrir entre ese importe.",
    warnings,
  };
}

export function calculateIndexFuture(input: CalculationInput): CalculationResult {
  const indexSpot = asNumber(input.indexSpot);
  const days = asNumber(input.days);
  const riskFreeRate = normalizeRate(input.riskFreeRate);
  const dividendYield = normalizeRate(input.dividendYield);
  const t = days / 360;
  const futurePrice = indexSpot * Math.exp((riskFreeRate - dividendYield) * t);
  const warnings = compactWarnings([
    requirePositive(indexSpot, "el índice spot"),
    requirePositive(days, "el plazo"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
    requireRate(input.dividendYield, "la tasa de dividendos"),
  ]);

  return {
    results: { futurePrice: round(futurePrice, 4), carryRate: round(riskFreeRate - dividendYield, 6) },
    metrics: [
      { key: "futurePrice", label: "Futuro teórico del índice", value: futurePrice, emphasis: true },
      { key: "carryRate", label: "Costo de acarreo neto", value: riskFreeRate - dividendYield, unit: "%" },
    ],
    formula: "F = Índice × e^((Rf - d) × n/360)",
    steps: [
      `Costo neto = ${formatPercent(riskFreeRate)} - ${formatPercent(dividendYield)} = ${formatPercent(riskFreeRate - dividendYield)}`,
      `F = ${formatNumber(indexSpot, 2)} × e^(${formatPercent(riskFreeRate - dividendYield)} × ${days}/360)`,
      `F = ${formatNumber(futurePrice, 4)}`,
    ],
    interpretation: `El precio teórico del futuro sobre índice sería ${formatNumber(futurePrice, 4)} puntos.`,
    examExplanation: "Para futuros sobre índices se capitaliza el índice spot con la tasa libre de riesgo neta de dividendos durante el plazo.",
    warnings,
  };
}
