import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, round } from "../formatters";
import { compactWarnings, requirePositive } from "../validation";

const syntheticMap: Record<string, { name: string; formula: string; cover: string }> = {
  a: { name: "Largo en el subyacente", formula: "+A = +C - P", cover: "Cubre alza de precios" },
  b: { name: "Corto en el subyacente", formula: "-A = -C + P", cover: "Cubre baja de precios" },
  c: { name: "Largo en el call", formula: "+C = +A + P", cover: "Cubre alza de precios" },
  d: { name: "Corto en el call", formula: "-C = -A - P", cover: "Cubre baja de precios" },
  e: { name: "Largo en el put", formula: "+P = +C - A", cover: "Cubre baja de precios" },
  f: { name: "Corto en el put", formula: "-P = -C + A", cover: "Cubre alza de precios" },
};

export function calculateSyntheticDerivative(input: CalculationInput): CalculationResult {
  const code = String(input.code).toLowerCase();
  const spot = asNumber(input.spot);
  const strike = asNumber(input.strike);
  const callPremium = asNumber(input.callPremium);
  const putPremium = asNumber(input.putPremium);
  const finalPrice = asNumber(input.finalPrice);
  const position = syntheticMap[code] ?? syntheticMap.a;

  const cost = code === "a" ? callPremium - putPremium
    : code === "b" ? putPremium - callPremium
      : code === "c" ? spot + putPremium
        : code === "d" ? -spot - putPremium
          : code === "e" ? callPremium - spot
            : -callPremium + spot;
  const payoff = code === "a" ? finalPrice - strike
    : code === "b" ? strike - finalPrice
      : code === "c" ? Math.max(finalPrice - strike, 0)
        : code === "d" ? -Math.max(finalPrice - strike, 0)
          : code === "e" ? Math.max(strike - finalPrice, 0)
            : -Math.max(strike - finalPrice, 0);
  const profitLoss = payoff - cost;
  const warnings = compactWarnings([
    syntheticMap[code] ? null : "Código inválido. Usa a, b, c, d, e o f.",
    requirePositive(spot, "el spot"),
    requirePositive(strike, "el strike"),
    requirePositive(finalPrice, "el precio final"),
  ]);

  return {
    results: { cost: round(cost, 4), payoff: round(payoff, 4), profitLoss: round(profitLoss, 4), position: position.name },
    metrics: [
      { key: "position", label: "Posición", value: position.name, emphasis: true },
      { key: "cost", label: "Costo neto", value: cost, unit: "$" },
      { key: "payoff", label: "Payoff", value: payoff, unit: "$", emphasis: true },
      { key: "profitLoss", label: "P/L", value: profitLoss, unit: "$", emphasis: true },
    ],
    formula: position.formula,
    steps: [
      `Código ${code}: ${position.name}`,
      `Fórmula sintética: ${position.formula}`,
      `Payoff calculado con precio final ${formatMoney(finalPrice)} y strike ${formatMoney(strike)} = ${formatMoney(payoff)}`,
      `P/L = payoff - costo = ${formatMoney(payoff)} - ${formatMoney(cost)} = ${formatMoney(profitLoss)}`,
    ],
    interpretation: `${position.name}. ${position.cover}. Resultado neto estimado: ${formatMoney(profitLoss)}.`,
    examExplanation: "Identificamos el código de posición, traducimos a su fórmula sintética y luego calculamos payoff y utilidad neta con primas/costos.",
    warnings,
  };
}
