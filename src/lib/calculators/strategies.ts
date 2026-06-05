import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, round } from "../formatters";
import { compactWarnings, requirePositive, requireNonNegative } from "../validation";

export function calculateOptionStrategies(input: CalculationInput): CalculationResult {
  const strategy = String(input.strategy);
  const strike1 = asNumber(input.strike1);
  const strike2 = asNumber(input.strike2);
  const premium1 = asNumber(input.premium1);
  const premium2 = asNumber(input.premium2);

  let maxProfit = 0;
  let maxLoss = 0;
  let breakEven1 = 0;
  let breakEven2: number | null = null;
  let netCost = 0;

  if (strategy === "bull_spread_call") {
    // Buy Call K1 (lower), Sell Call K2 (higher)
    netCost = premium1 - premium2;
    maxLoss = netCost;
    maxProfit = (strike2 - strike1) - netCost;
    breakEven1 = strike1 + netCost;
  } else if (strategy === "bear_spread_put") {
    // Buy Put K2 (higher), Sell Put K1 (lower)
    netCost = premium2 - premium1;
    maxLoss = netCost;
    maxProfit = (strike2 - strike1) - netCost;
    breakEven1 = strike2 - netCost;
  } else if (strategy === "straddle") {
    // Buy Call K1, Buy Put K1
    netCost = premium1 + premium2;
    maxLoss = netCost;
    maxProfit = Infinity; // Technically infinite on the upside
    breakEven1 = strike1 - netCost;
    breakEven2 = strike1 + netCost;
  } else if (strategy === "strangle") {
    // Buy Put K1 (lower), Buy Call K2 (higher)
    netCost = premium1 + premium2;
    maxLoss = netCost;
    maxProfit = Infinity;
    breakEven1 = strike1 - netCost;
    breakEven2 = strike2 + netCost;
  }

  const warnings = compactWarnings([
    requirePositive(strike1, "el strike 1"),
    requirePositive(strike2, "el strike 2"),
    requireNonNegative(premium1, "la prima 1"),
    requireNonNegative(premium2, "la prima 2"),
    (strategy === "bull_spread_call" || strategy === "strangle") && strike1 >= strike2 
      ? "El Strike 1 debería ser menor al Strike 2 para esta estrategia." 
      : null,
    strategy === "bear_spread_put" && strike1 >= strike2 
      ? "El Strike 1 debería ser menor al Strike 2 (K1 es el Put vendido, K2 el comprado)." 
      : null,
  ]);

  const steps = [
    `Costo neto inicial = ${formatMoney(netCost)}`,
    `Pérdida máxima = ${formatMoney(maxLoss)}`,
    `Ganancia máxima = ${maxProfit === Infinity ? "Infinita" : formatMoney(maxProfit)}`,
    `Punto de equilibrio 1 = ${formatMoney(breakEven1)}`,
  ];
  if (breakEven2 !== null) {
    steps.push(`Punto de equilibrio 2 = ${formatMoney(breakEven2)}`);
  }

  return {
    results: { netCost: round(netCost, 4), maxProfit: maxProfit === Infinity ? 999999 : round(maxProfit, 4), maxLoss: round(maxLoss, 4), breakEven1: round(breakEven1, 4), breakEven2: breakEven2 ? round(breakEven2, 4) : 0 },
    metrics: [
      { key: "netCost", label: "Costo Inicial (Prima Neta)", value: netCost, unit: "$", emphasis: true },
      { key: "maxProfit", label: "Ganancia Máxima", value: maxProfit === Infinity ? "Infinita" : maxProfit, unit: maxProfit === Infinity ? "" : "$" },
      { key: "maxLoss", label: "Pérdida Máxima", value: maxLoss, unit: "$" },
      { key: "breakEven1", label: "Punto de Equilibrio 1", value: breakEven1, unit: "$" },
      ...(breakEven2 !== null ? [{ key: "breakEven2", label: "Punto de Equilibrio 2", value: breakEven2, unit: "$" }] : []),
    ],
    formula: "PE = K + Costo (Call) / PE = K - Costo (Put)",
    steps,
    interpretation: `La estrategia requiere una inversión inicial de ${formatMoney(netCost)}. Empiezas a ganar a partir de ${formatMoney(breakEven1)} ${breakEven2 !== null ? `y ${formatMoney(breakEven2)}` : ""}.`,
    examExplanation: "Calculamos primero el flujo de primas (compras restan, ventas suman al flujo, costo neto es lo invertido). El PE se halla sumando/restando el costo neto a los strikes involucrados.",
    warnings,
  };
}
