import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, round } from "../formatters";
import { compactWarnings, requireNonNegative, requirePositive } from "../validation";

export function calculatePayoffWithoutPremium(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const strike = asNumber(input.strike);
  const longForward = spot - strike;
  const shortForward = strike - spot;
  const warnings = compactWarnings([requirePositive(spot, "el spot"), requirePositive(strike, "el strike")]);
  return {
    results: { longForward: round(longForward, 4), shortForward: round(shortForward, 4) },
    metrics: [
      { key: "longForward", label: "Forward largo", value: longForward, unit: "$", emphasis: true },
      { key: "shortForward", label: "Forward corto", value: shortForward, unit: "$", emphasis: true },
    ],
    formula: "Forward largo = Spot - Strike; Forward corto = Strike - Spot",
    steps: [
      `Forward largo = ${formatMoney(spot)} - ${formatMoney(strike)} = ${formatMoney(longForward)}`,
      `Forward corto = ${formatMoney(strike)} - ${formatMoney(spot)} = ${formatMoney(shortForward)}`,
    ],
    interpretation: `Si el spot final es ${formatMoney(spot)}, el largo gana ${formatMoney(longForward)} y el corto gana ${formatMoney(shortForward)}.`,
    examExplanation: "El forward largo gana cuando el precio final sube sobre el strike; el corto gana cuando queda por debajo.",
    warnings,
  };
}

export function calculatePayoffWithPremium(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const strike = asNumber(input.strike);
  const callPremium = asNumber(input.callPremium);
  const putPremium = asNumber(input.putPremium);
  const callBought = Math.max(spot - strike, 0) - callPremium;
  const putBought = Math.max(strike - spot, 0) - putPremium;
  const callSold = callPremium - Math.max(spot - strike, 0);
  const putSold = putPremium - Math.max(strike - spot, 0);
  const warnings = compactWarnings([
    requirePositive(spot, "el spot"),
    requirePositive(strike, "el strike"),
    requireNonNegative(callPremium, "la prima call"),
    requireNonNegative(putPremium, "la prima put"),
  ]);
  return {
    results: { callBought, putBought, callSold, putSold },
    metrics: [
      { key: "callBought", label: "Call comprado", value: callBought, unit: "$", emphasis: true },
      { key: "putBought", label: "Put comprado", value: putBought, unit: "$", emphasis: true },
      { key: "callSold", label: "Call vendido", value: callSold, unit: "$" },
      { key: "putSold", label: "Put vendido", value: putSold, unit: "$" },
    ],
    formula: "Call comprado=max(S-K,0)-prima; Put comprado=max(K-S,0)-prima",
    steps: [
      `Call comprado = max(${spot}-${strike}, 0) - ${callPremium} = ${formatMoney(callBought)}`,
      `Put comprado = max(${strike}-${spot}, 0) - ${putPremium} = ${formatMoney(putBought)}`,
      `Call vendido = ${callPremium} - max(${spot}-${strike}, 0) = ${formatMoney(callSold)}`,
      `Put vendido = ${putPremium} - max(${strike}-${spot}, 0) = ${formatMoney(putSold)}`,
    ],
    interpretation: "Los compradores pagan prima y tienen pérdida limitada; los vendedores reciben prima y asumen el payoff contrario.",
    examExplanation: "Primero calculamos el valor intrínseco de cada opción y luego sumamos o restamos la prima según sea compra o venta.",
    warnings,
  };
}
