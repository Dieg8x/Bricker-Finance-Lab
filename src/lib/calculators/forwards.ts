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
  const notionalUSD = asNumber(input.notionalUSD || 0);
  const spotAtMaturity = asNumber(input.spotAtMaturity || 0);
  const position = String(input.position || "buy");

  const buyForward = spotBuy * ((1 + domesticPassive * days / 360) / (1 + foreignActive * days / 360));
  const sellForward = spotSell * ((1 + domesticActive * days / 360) / (1 + foreignPassive * days / 360));

  // Financial result at maturity
  // Buy USD forward: locked in buyForward → if spotAtMaturity > buyForward, you saved MXN
  // Sell USD forward: locked in sellForward → if spotAtMaturity < sellForward, you got more MXN
  const lockedRate = position === "buy" ? buyForward : sellForward;
  const savingsMXN = notionalUSD > 0 && spotAtMaturity > 0
    ? position === "buy"
      ? (spotAtMaturity - lockedRate) * notionalUSD   // positive = paid less than market
      : (lockedRate - spotAtMaturity) * notionalUSD   // positive = received more than market
    : 0;
  const costWithForward = notionalUSD > 0 ? lockedRate * notionalUSD : 0;
  const costAtSpot = notionalUSD > 0 && spotAtMaturity > 0 ? spotAtMaturity * notionalUSD : 0;

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
    results: { buyForward: round(buyForward, 4), sellForward: round(sellForward, 4), savingsMXN: round(savingsMXN, 2), costWithForward: round(costWithForward, 2), costAtSpot: round(costAtSpot, 2) },
    metrics: [
      { key: "buyForward", label: "Forward compra (MXN/USD)", value: buyForward, unit: "MXN/USD", emphasis: true },
      { key: "sellForward", label: "Forward venta (MXN/USD)", value: sellForward, unit: "MXN/USD", emphasis: true },
      ...(notionalUSD > 0 ? [
        { key: "costWithForward", label: `Costo total con forward (${position === "buy" ? "compra" : "venta"})`, value: costWithForward, unit: "$" },
      ] : []),
      ...(notionalUSD > 0 && spotAtMaturity > 0 ? [
        { key: "costAtSpot", label: "Costo si usas mercado spot al vencimiento", value: costAtSpot, unit: "$" },
        { key: "savingsMXN", label: "Resultado del forward (MXN)", value: savingsMXN, unit: "$", emphasis: true },
      ] : []),
    ],
    formula: "F = Spot × [(1 + r_MX × d/360) / (1 + r_USD × d/360)]  |  Resultado = (Spot_vto − F) × Nocional",
    steps: [
      `F compra = ${formatNumber(spotBuy, 4)} × [(1+${formatPercent(domesticPassive)}×${days}/360)/(1+${formatPercent(foreignActive)}×${days}/360)] = ${formatNumber(buyForward, 4)}`,
      `F venta = ${formatNumber(spotSell, 4)} × [(1+${formatPercent(domesticActive)}×${days}/360)/(1+${formatPercent(foreignPassive)}×${days}/360)] = ${formatNumber(sellForward, 4)}`,
      ...(notionalUSD > 0 && spotAtMaturity > 0 ? [
        `Tasa pactada (${position === "buy" ? "compra" : "venta"}) = ${formatNumber(lockedRate, 4)} MXN/USD`,
        `Spot al vencimiento = ${formatNumber(spotAtMaturity, 4)} MXN/USD`,
        `Resultado = (${formatNumber(spotAtMaturity, 4)} − ${formatNumber(lockedRate, 4)}) × ${notionalUSD.toLocaleString("es-MX")} USD ${position === "buy" ? "" : "(invertido)"}= ${formatNumber(savingsMXN, 2)} MXN`,
      ] : []),
    ],
    interpretation: `Forward compra: ${formatNumber(buyForward, 4)} MXN/USD. Forward venta: ${formatNumber(sellForward, 4)} MXN/USD.${notionalUSD > 0 && spotAtMaturity > 0 ? ` Resultado del forward: ${savingsMXN >= 0 ? "ahorro de" : "costo adicional de"} ${formatNumber(Math.abs(savingsMXN), 2)} MXN vs comprar/vender en spot al vencimiento.` : ""}`,
    examExplanation: "1) Ajusta el spot por diferencial de tasas doméstica/extranjera. 2) Para saber si te convino: compara la tasa del forward contra el spot real al vencimiento y multiplica por el nocional.",
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
