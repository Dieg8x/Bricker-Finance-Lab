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
  // splitRatio: fracción del beneficio neto que recibe A (0.5 = 50/50, 0.6 = 60/40, etc.)
  const splitRaw = input.splitRatio !== undefined ? asNumber(input.splitRatio) : 0.5;
  const splitRatio = isNaN(splitRaw) ? 0.5 : Math.min(Math.max(splitRaw, 0), 1);

  const fixedDiff = Math.abs(fixedA - fixedB);
  const variableDiff = Math.abs(variableA - variableB);
  const totalAdvantage = fixedDiff - variableDiff;
  const bankShare = Math.max(totalAdvantage * bankCommission, 0);
  const netBenefit = Math.max(totalAdvantage - bankShare, 0);

  const benefitA = netBenefit * splitRatio;
  const benefitB = netBenefit * (1 - splitRatio);
  const benefitPerCompany = netBenefit / 2; // kept for backwards-compat display

  // ── Diagram rates ─────────────────────────────────────────────────────────
  // Setup: A borrows variable externally (comparative advantage), B borrows
  // fixed externally. Bank sits in the middle passing fixed one way, variable
  // the other (reference rate = variableA).
  //   A_net_fixed = fixedA - benefitA  (target: improves on fixedA directly)
  //   B_net_var   = variableB - benefitB (target: improves on variableB directly)
  //
  // Swap flows:
  //   A pays bank:    swapFixedA  (fixed)     = fixedA - benefitA
  //   Bank pays A:    referenceRate (variable) = variableA
  //   B pays bank:    referenceRate (variable) = variableA
  //   Bank pays B:    swapFixedB  (fixed)     = fixedB + variableA - variableB + benefitB
  //
  // Bank net = swapFixedA - swapFixedB = totalAdvantage - netBenefit = bankShare ✓
  const referenceRate = variableA;
  const swapFixedA = fixedA - benefitA;
  const swapFixedB = fixedB + variableA - variableB + benefitB;
  const netA = fixedA - benefitA;
  const netB = variableB - benefitB;

  const warnings = compactWarnings([
    requireRate(input.fixedA, "la tasa fija de A"),
    requireRate(input.variableA, "la tasa variable de A"),
    requireRate(input.fixedB, "la tasa fija de B"),
    requireRate(input.variableB, "la tasa variable de B"),
    totalAdvantage <= 0 ? "No hay ventaja comparativa positiva con estos datos." : null,
    netB < 0 ? "La tasa variable neta de B resulta negativa — revisa los valores de entrada." : null,
  ]);

  return {
    results: {
      fixedA, variableA, fixedB, variableB,
      fixedDiff, variableDiff, totalAdvantage, bankShare, netBenefit, benefitPerCompany,
      benefitA, benefitB, splitRatio,
      swapFixedA, swapFixedB, referenceRate, netA, netB,
    },
    metrics: [
      { key: "totalAdvantage", label: "Ventaja total", value: totalAdvantage, unit: "%", emphasis: true },
      { key: "bankShare", label: "Comisión banco", value: bankShare, unit: "%" },
      { key: "netBenefit", label: "Beneficio neto a repartir", value: netBenefit, unit: "%", emphasis: true },
      { key: "benefitA", label: `Beneficio Empresa A (${Math.round(splitRatio * 100)}%)`, value: benefitA, unit: "%" },
      { key: "benefitB", label: `Beneficio Empresa B (${Math.round((1 - splitRatio) * 100)}%)`, value: benefitB, unit: "%" },
      { key: "netA", label: "Tasa efectiva A (fija)", value: netA, unit: "%", emphasis: true },
      { key: "netB", label: "Tasa efectiva B (variable)", value: netB, unit: "%", emphasis: true },
      { key: "swapFixedA", label: "A paga al banco (swap fijo)", value: swapFixedA, unit: "%" },
      { key: "swapFixedB", label: "Banco paga a B (swap fijo)", value: swapFixedB, unit: "%" },
      { key: "referenceRate", label: "Tasa variable de referencia", value: referenceRate, unit: "%" },
    ],
    formula: "Ventaja total = |Δ_fija| - |Δ_variable|  |  swapA = rF_A - beneficioA  |  swapB = rF_B + r_ref - rV_B + beneficioB",
    steps: [
      `Diferencial fijo = |${formatPercent(fixedA)} - ${formatPercent(fixedB)}| = ${formatPercent(fixedDiff)}`,
      `Diferencial variable = |${formatPercent(variableA)} - ${formatPercent(variableB)}| = ${formatPercent(variableDiff)}`,
      `Ventaja total = ${formatPercent(fixedDiff)} - ${formatPercent(variableDiff)} = ${formatPercent(totalAdvantage)}`,
      `Comisión banco = ${formatPercent(totalAdvantage)} × ${formatPercent(bankCommission)} = ${formatPercent(bankShare)}`,
      `Beneficio neto = ${formatPercent(netBenefit)} → A recibe ${formatPercent(benefitA)} / B recibe ${formatPercent(benefitB)} (reparto ${Math.round(splitRatio * 100)}/${Math.round((1 - splitRatio) * 100)})`,
      `A: paga ${formatPercent(swapFixedA)} fijo al banco / recibe ${formatPercent(referenceRate)} variable → tasa efectiva: ${formatPercent(netA)} fija`,
      `B: paga ${formatPercent(referenceRate)} variable al banco / recibe ${formatPercent(swapFixedB)} fijo → tasa efectiva: ${formatPercent(netB)} variable`,
      `Banco: ${formatPercent(swapFixedA)} - ${formatPercent(swapFixedB)} = ${formatPercent(bankShare)} ✓`,
    ],
    interpretation: totalAdvantage > 0
      ? `Con reparto ${Math.round(splitRatio * 100)}/${Math.round((1 - splitRatio) * 100)}: A mejora su tasa fija de ${formatPercent(fixedA)} a ${formatPercent(netA)} (ahorro ${formatPercent(benefitA)}). B mejora su tasa variable de ${formatPercent(variableB)} a ${formatPercent(netB)} (ahorro ${formatPercent(benefitB)}). Banco: ${formatPercent(bankShare)}.`
      : "Con estos datos no hay ventaja comparativa positiva.",
    examExplanation: "1) Calcula diferencial fijo y variable. 2) Ventaja = dif.fijo - dif.variable. 3) Resta comisión del banco. 4) Reparte el resto según el acuerdo. 5) La tasa fija que A paga al banco = rF_A - beneficioA. La tasa fija que B recibe = rF_B + r_ref - rV_B + beneficioB. El banco se queda con la diferencia.",
    warnings,
  };
}

export function calculateEquitySwap(input: CalculationInput): CalculationResult {
  const notional = asNumber(input.notional);
  const initialPrice = asNumber(input.initialPrice);
  const finalPrice = asNumber(input.finalPrice);
  const rate = normalizeRate(input.rate);
  const days = asNumber(input.days);
  const position = String(input.position || "equityPayer");

  const equityReturn = initialPrice > 0 ? notional * (finalPrice / initialPrice - 1) : 0;
  const rateCashFlow = notional * rate * (days / 360);
  // Equity payer: pays equity return, receives rate payment  → net = rateCashFlow - equityReturn
  // Rate payer:  receives equity return, pays rate payment   → net = equityReturn - rateCashFlow
  const net = position === "equityPayer" ? rateCashFlow - equityReturn : equityReturn - rateCashFlow;
  const equityReturnPct = initialPrice > 0 ? (finalPrice - initialPrice) / initialPrice : 0;

  const warnings = compactWarnings([
    requirePositive(notional, "el nocional"),
    requirePositive(initialPrice, "el precio inicial"),
    requirePositive(finalPrice, "el precio final"),
    requireRate(input.rate, "la tasa de referencia"),
    requirePositive(days, "el plazo"),
  ]);

  return {
    results: { equityReturn: round(equityReturn, 2), rateCashFlow: round(rateCashFlow, 2), net: round(net, 2), equityReturnPct: round(equityReturnPct, 6) },
    metrics: [
      { key: "equityReturn", label: "Rendimiento de la acción/índice", value: equityReturn, unit: "$", emphasis: true },
      { key: "rateCashFlow", label: "Pago de tasa variable", value: rateCashFlow, unit: "$" },
      { key: "net", label: "Flujo neto del swap", value: net, unit: "$", emphasis: true },
      { key: "equityReturnPct", label: "Rendimiento % del subyacente", value: equityReturnPct, unit: "%" },
    ],
    formula: "Rendimiento_equity = N × (ST/S0 - 1)  |  Pago_tasa = N × r × d/360  |  Neto = Pago_tasa - Rendimiento_equity",
    steps: [
      `Rendimiento equity = ${formatMoney(notional)} × (${finalPrice}/${initialPrice} − 1) = ${formatMoney(equityReturn)}`,
      `Pago de tasa = ${formatMoney(notional)} × ${formatPercent(rate)} × ${days}/360 = ${formatMoney(rateCashFlow)}`,
      `${position === "equityPayer" ? "Pagador de equity (recibe tasa)" : "Pagador de tasa (recibe equity)"}: ${formatMoney(rateCashFlow)} − ${formatMoney(equityReturn)} = ${formatMoney(net)}`,
    ],
    interpretation: `El subyacente ${finalPrice >= initialPrice ? "subió" : "bajó"} ${formatPercent(Math.abs(equityReturnPct))} (rendimiento ${formatMoney(equityReturn)}). El pago de tasa variable es ${formatMoney(rateCashFlow)}. Flujo neto del swap: ${net >= 0 ? "recibe" : "paga"} ${formatMoney(Math.abs(net))}.`,
    examExplanation: "1) Calcula el rendimiento del subyacente (ST/S0 - 1) × nocional. 2) Calcula el pago de tasa variable (N × r × d/360). 3) El flujo neto depende de qué posición tienes: pagador de equity recibe la tasa y paga el rendimiento del subyacente.",
    warnings,
  };
}
