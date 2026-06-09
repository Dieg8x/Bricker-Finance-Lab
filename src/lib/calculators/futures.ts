import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, formatNumber, formatPercent, normalizeRate, round } from "../formatters";
import { compactWarnings, requireNonNegative, requirePositive, requireRate } from "../validation";

export function calculateSimpleFuture(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const days = asNumber(input.days);
  const rate = normalizeRate(input.riskFreeRate);
  const compounding = String(input.compounding || "simple");
  
  const factor = compounding === "continuous" 
    ? Math.exp(rate * (days / 360))
    : (1 + rate * (days / 360));
    
  const futurePrice = spot * factor;
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
    formula: compounding === "continuous" ? "F = S × e^(r × d/360)" : "F = S × (1 + r × d / 360)",
    steps: [
      `Se usa la fórmula de precio futuro con capitalización ${compounding === "continuous" ? "continua" : "simple"} y base 360.`,
      compounding === "continuous" 
        ? `F = ${formatMoney(spot)} × e^(${formatPercent(rate)} × ${days}/360)`
        : `F = ${formatMoney(spot)} × (1 + ${formatPercent(rate)} × ${days}/360)`,
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
  const compounding = String(input.compounding || "simple");
  const hasDividend = String(input.dividendMode || "no") === "yes";

  const dividend = hasDividend ? asNumber(input.dividend) : 0;
  const dividendDays = hasDividend ? asNumber(input.dividendDays) : 0;

  const pvFactor = compounding === "continuous"
    ? Math.exp(-rate * (dividendDays / 360))
    : 1 / (1 + rate * (dividendDays / 360));

  const pvDividend = hasDividend ? dividend * pvFactor : 0;

  const fvFactor = compounding === "continuous"
    ? Math.exp(rate * (days / 360))
    : (1 + rate * (days / 360));

  const futurePrice = (spot - pvDividend) * fvFactor;

  const warnings = compactWarnings([
    requirePositive(spot, "el precio spot"),
    requirePositive(days, "el plazo"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
    hasDividend ? requireNonNegative(dividend, "el dividendo") : null,
    hasDividend ? requireNonNegative(dividendDays, "los días al dividendo") : null,
  ]);

  const formulaSinDiv = compounding === "continuous" ? "F = S × e^(r×d/360)" : "F = S × (1 + r × d/360)";
  const formulaConDiv = compounding === "continuous" ? "F = (S - VP_div) × e^(r×d/360)" : "F = (S - VP_div) × (1 + r × d/360)";

  const stepsSinDiv = [
    compounding === "continuous"
      ? `F = ${formatMoney(spot)} × e^(${formatPercent(rate)} × ${days}/360)`
      : `F = ${formatMoney(spot)} × (1 + ${formatPercent(rate)} × ${days}/360)`,
    `F = ${formatMoney(futurePrice)}`,
  ];

  const stepsConDiv = [
    compounding === "continuous"
      ? `VP(dividendo) = ${formatMoney(dividend)} × e^(-${formatPercent(rate)} × ${dividendDays}/360) = ${formatMoney(pvDividend)}`
      : `VP(dividendo) = ${formatMoney(dividend)} / (1 + ${formatPercent(rate)} × ${dividendDays}/360) = ${formatMoney(pvDividend)}`,
    compounding === "continuous"
      ? `F = (${formatMoney(spot)} - ${formatMoney(pvDividend)}) × e^(${formatPercent(rate)} × ${days}/360)`
      : `F = (${formatMoney(spot)} - ${formatMoney(pvDividend)}) × (1 + ${formatPercent(rate)} × ${days}/360)`,
    `F = ${formatMoney(futurePrice)}`,
  ];

  return {
    results: { pvDividend: round(pvDividend, 4), futurePrice: round(futurePrice, 4) },
    metrics: [
      { key: "futurePrice", label: "Precio futuro de la acción", value: futurePrice, unit: "$", emphasis: true },
      ...(hasDividend ? [{ key: "pvDividend", label: "VP del dividendo descontado", value: pvDividend, unit: "$" }] : []),
    ],
    formula: hasDividend ? formulaConDiv : formulaSinDiv,
    steps: hasDividend ? stepsConDiv : stepsSinDiv,
    interpretation: hasDividend
      ? `Con dividendo de ${formatMoney(dividend)} en ${dividendDays} días, el precio futuro teórico es ${formatMoney(futurePrice)}.`
      : `Sin dividendo, el precio futuro teórico de la acción es ${formatMoney(futurePrice)}.`,
    examExplanation: hasDividend
      ? "1) Descuenta el dividendo a valor presente. 2) Réstalo al spot. 3) Capitaliza al plazo del futuro."
      : "Sin dividendo: simplemente capitaliza el spot por la tasa libre de riesgo durante el plazo.",
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

export function calculateCrossHedging(input: CalculationInput): CalculationResult {
  const portfolioValue = asNumber(input.portfolioValue);
  const futurePrice = asNumber(input.futurePrice);
  const multiplier = asNumber(input.multiplier);
  const beta = asNumber(input.beta);
  
  const contractValue = futurePrice * multiplier;
  const rawContracts = (beta * portfolioValue) / contractValue;
  const contracts = Math.round(rawContracts);

  const warnings = compactWarnings([
    requirePositive(portfolioValue, "el valor del portafolio"),
    requirePositive(futurePrice, "el precio futuro"),
    requirePositive(multiplier, "el multiplicador"),
    requirePositive(beta, "la Beta (o ratio de correlación)"),
  ]);

  return {
    results: { contractValue: round(contractValue, 4), rawContracts: round(rawContracts, 4), contracts },
    metrics: [
      { key: "contracts", label: "Contratos (Redondeado)", value: contracts, emphasis: true },
      { key: "rawContracts", label: "Contratos (Exacto)", value: rawContracts },
      { key: "contractValue", label: "Valor por contrato", value: contractValue, unit: "$" },
    ],
    formula: "N = Beta × (Valor Portafolio / Valor Contrato)",
    steps: [
      `Valor del contrato = ${formatNumber(futurePrice, 2)} × ${formatNumber(multiplier, 2)} = ${formatMoney(contractValue)}`,
      `Contratos (N) = ${formatNumber(beta, 2)} × (${formatMoney(portfolioValue)} / ${formatMoney(contractValue)}) = ${formatNumber(rawContracts, 4)}`,
      `Se redondea a ${contracts} contratos.`,
    ],
    interpretation: `Para cubrir el portafolio dada su volatilidad (Beta de ${formatNumber(beta, 2)}), se requiere vender ${contracts} contratos.`,
    examExplanation: "Para la cobertura cruzada o ajuste de beta, multiplicamos la cantidad teórica de contratos por el factor Beta o Ratio de Cobertura de Varianza Mínima.",
    warnings,
  };
}

export function calculateIPCCoverage(input: CalculationInput): CalculationResult {
  const ipcSpot = asNumber(input.ipcSpot);
  const riskFreeRate = normalizeRate(input.riskFreeRate);
  const days = asNumber(input.days);
  const portfolioValue = asNumber(input.portfolioValue);
  const multiplier = asNumber(input.multiplier);
  const spotAtMaturity = asNumber(input.spotAtMaturity);

  const t = days / 360;
  const theoreticalPrice = ipcSpot * (1 + riskFreeRate * t);
  const contractValue = theoreticalPrice * multiplier;
  const contracts = Math.ceil(portfolioValue / contractValue);
  const actualContracts = portfolioValue / contractValue;

  const futuresGain = contracts * (theoreticalPrice - spotAtMaturity) * multiplier;
  const portfolioLoss = portfolioValue * ((spotAtMaturity - ipcSpot) / ipcSpot);
  const netResult = portfolioLoss + futuresGain;

  const warnings = compactWarnings([
    requirePositive(ipcSpot, "el IPC spot"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
    requirePositive(days, "el plazo"),
    requirePositive(portfolioValue, "el valor del portafolio"),
    requirePositive(multiplier, "el multiplicador"),
  ]);

  return {
    results: {
      theoreticalPrice: round(theoreticalPrice, 2),
      contractValue: round(contractValue, 2),
      contracts,
      actualContracts: round(actualContracts, 4),
      futuresGain: round(futuresGain, 2),
      portfolioLoss: round(portfolioLoss, 2),
      netResult: round(netResult, 2),
    },
    metrics: [
      { key: "theoreticalPrice", label: "Precio futuro teorico (IPC)", value: theoreticalPrice, emphasis: true },
      { key: "contractValue", label: "Valor nocional por contrato", value: contractValue, unit: "$" },
      { key: "contracts", label: "Contratos necesarios", value: contracts, emphasis: true },
      { key: "actualContracts", label: "Contratos exactos", value: actualContracts },
      ...(input.spotAtMaturity ? [
        { key: "futuresGain", label: "Ganancia/perdida en futuros", value: futuresGain, unit: "$" },
        { key: "portfolioLoss", label: "Resultado del portafolio", value: portfolioLoss, unit: "$" },
        { key: "netResult", label: "Resultado neto cubierto", value: netResult, unit: "$", emphasis: true },
      ] : []),
    ],
    formula: "F = IPC_spot × (1 + r × d/360) | Contratos = Valor_portafolio / (F × multiplicador)",
    steps: [
      `F = ${formatNumber(ipcSpot, 0)} × (1 + ${formatPercent(riskFreeRate)} × ${days}/360) = ${formatNumber(theoreticalPrice, 2)}`,
      `Valor por contrato = ${formatNumber(theoreticalPrice, 2)} × ${multiplier} = ${formatMoney(contractValue)}`,
      `Contratos exactos = ${formatMoney(portfolioValue)} / ${formatMoney(contractValue)} = ${formatNumber(actualContracts, 4)}`,
      `Contratos (redondeado hacia arriba) = ${contracts}`,
      ...(input.spotAtMaturity ? [
        `Al vencimiento (IPC = ${formatNumber(spotAtMaturity, 0)}): ganancia en futuros = ${formatMoney(futuresGain)}`,
        `Resultado portafolio = ${formatMoney(portfolioLoss)} | Resultado neto = ${formatMoney(netResult)}`,
      ] : []),
    ],
    interpretation: `El precio futuro teorico del IPC es ${formatNumber(theoreticalPrice, 2)} puntos. Se necesitan ${contracts} contratos CORTOS (venta) para cubrir el portafolio de ${formatMoney(portfolioValue)}.`,
    examExplanation: "Para cubrir un portafolio que replica el IPC: 1) Calcula el precio futuro teorico. 2) Divide el valor del portafolio entre el valor de un contrato para obtener contratos necesarios. 3) Toma posicion CORTA (vende futuros) porque el portafolio es largo.",
    warnings,
  };
}

export function calculateStockFutureCoverage(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const desiredYield = normalizeRate(input.desiredYield);
  const days = asNumber(input.days);
  const shares = asNumber(input.shares);
  const sharesPerContract = asNumber(input.sharesPerContract);
  const spotAtMaturity = asNumber(input.spotAtMaturity);

  const t = days / 360;
  const theoreticalPrice = spot * (1 + desiredYield * t);
  const contracts = Math.round(shares / sharesPerContract);
  const positionValue = shares * spot;
  const guaranteedValue = shares * theoreticalPrice;

  const futuresResult = contracts * sharesPerContract * (theoreticalPrice - spotAtMaturity);
  const spotResult = shares * spotAtMaturity;
  const totalWithHedge = spotResult + futuresResult;
  const yieldWithHedge = (totalWithHedge - positionValue) / positionValue;
  const yieldWithoutHedge = (spotResult - positionValue) / positionValue;

  const warnings = compactWarnings([
    requirePositive(spot, "el precio spot"),
    requireRate(input.desiredYield, "el rendimiento deseado"),
    requirePositive(days, "el plazo"),
    requirePositive(shares, "el numero de acciones"),
    requirePositive(sharesPerContract, "las acciones por contrato"),
  ]);

  return {
    results: {
      theoreticalPrice: round(theoreticalPrice, 4),
      contracts,
      positionValue: round(positionValue, 2),
      guaranteedValue: round(guaranteedValue, 2),
      futuresResult: round(futuresResult, 2),
      totalWithHedge: round(totalWithHedge, 2),
      yieldWithHedge: round(yieldWithHedge, 6),
      yieldWithoutHedge: round(yieldWithoutHedge, 6),
    },
    metrics: [
      { key: "theoreticalPrice", label: "Precio futuro / Strike", value: theoreticalPrice, unit: "$", emphasis: true },
      { key: "contracts", label: "Contratos necesarios", value: contracts, emphasis: true },
      { key: "positionValue", label: "Valor actual de la posicion", value: positionValue, unit: "$" },
      { key: "guaranteedValue", label: "Valor garantizado con cobertura", value: guaranteedValue, unit: "$" },
      ...(input.spotAtMaturity ? [
        { key: "futuresResult", label: "Resultado en futuros", value: futuresResult, unit: "$" },
        { key: "totalWithHedge", label: "Total recibido con cobertura", value: totalWithHedge, unit: "$", emphasis: true },
        { key: "yieldWithHedge", label: "Rendimiento CON cobertura", value: yieldWithHedge, unit: "%" },
        { key: "yieldWithoutHedge", label: "Rendimiento SIN cobertura", value: yieldWithoutHedge, unit: "%" },
      ] : []),
    ],
    formula: "F = S × (1 + r_deseado × d/360) | Contratos = acciones / acciones_por_contrato",
    steps: [
      `Precio futuro = ${formatMoney(spot)} × (1 + ${formatPercent(desiredYield)} × ${days}/360) = ${formatMoney(theoreticalPrice)}`,
      `Contratos = ${formatNumber(shares, 0)} acciones / ${sharesPerContract} por contrato = ${contracts}`,
      `Valor actual de la posicion = ${formatNumber(shares, 0)} × ${formatMoney(spot)} = ${formatMoney(positionValue)}`,
      `Valor garantizado = ${formatNumber(shares, 0)} × ${formatMoney(theoreticalPrice)} = ${formatMoney(guaranteedValue)}`,
      ...(input.spotAtMaturity ? [
        `Al vencimiento spot = ${formatMoney(spotAtMaturity)}`,
        `Resultado en futuros = ${contracts} × ${sharesPerContract} × (${formatMoney(theoreticalPrice)} - ${formatMoney(spotAtMaturity)}) = ${formatMoney(futuresResult)}`,
        `Total con cobertura = ${formatMoney(spotResult)} + ${formatMoney(futuresResult)} = ${formatMoney(totalWithHedge)}`,
        `Rendimiento con cobertura = ${formatPercent(yieldWithHedge)} vs sin cobertura = ${formatPercent(yieldWithoutHedge)}`,
      ] : []),
    ],
    interpretation: `El precio futuro que garantiza el rendimiento deseado es ${formatMoney(theoreticalPrice)} por accion. Se necesitan ${contracts} contratos de venta (POSICION CORTA en futuros) para garantizar el rendimiento de ${formatPercent(desiredYield)} anual.`,
    examExplanation: "1) Calcula el precio futuro teorico usando la tasa de rendimiento deseada. 2) El numero de contratos = acciones totales / acciones por contrato. 3) Toma posicion CORTA (vende futuros) para asegurar ese precio de venta.",
    warnings,
  };
}

export function calculateCommodityCoverage(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const riskFreeRate = normalizeRate(input.riskFreeRate);
  const days = asNumber(input.days);
  const units = asNumber(input.units);
  const spotAtMaturity = asNumber(input.spotAtMaturity);

  const t = days / 360;
  const theoreticalPrice = spot * (1 + riskFreeRate * t);

  const spotPurchaseCost = units * spotAtMaturity;
  const futureCost = units * theoreticalPrice;
  const savingsWithFuture = spotPurchaseCost - futureCost;

  const warnings = compactWarnings([
    requirePositive(spot, "el precio spot"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
    requirePositive(days, "el plazo"),
    requirePositive(units, "el numero de unidades"),
  ]);

  return {
    results: {
      theoreticalPrice: round(theoreticalPrice, 4),
      futureCost: round(futureCost, 2),
      spotPurchaseCost: round(spotPurchaseCost, 2),
      savingsWithFuture: round(savingsWithFuture, 2),
    },
    metrics: [
      { key: "theoreticalPrice", label: "Precio futuro teorico", value: theoreticalPrice, unit: "$", emphasis: true },
      { key: "futureCost", label: "Costo total con futuro", value: futureCost, unit: "$" },
      ...(input.spotAtMaturity ? [
        { key: "spotPurchaseCost", label: "Costo si compra en spot", value: spotPurchaseCost, unit: "$" },
        { key: "savingsWithFuture", label: "Diferencia futuro vs spot", value: savingsWithFuture, unit: "$", emphasis: true },
      ] : []),
    ],
    formula: "F = S × (1 + r × d/360) | Resultado = Unidades × (F_spot_vto - F_pactado)",
    steps: [
      `F = ${formatMoney(spot)} × (1 + ${formatPercent(riskFreeRate)} × ${days}/360) = ${formatMoney(theoreticalPrice)}`,
      `Costo total con futuro = ${formatNumber(units, 0)} unidades × ${formatMoney(theoreticalPrice)} = ${formatMoney(futureCost)}`,
      ...(input.spotAtMaturity ? [
        `Costo en mercado spot al vencimiento = ${formatNumber(units, 0)} × ${formatMoney(spotAtMaturity)} = ${formatMoney(spotPurchaseCost)}`,
        `Diferencia (ahorro con futuro) = ${formatMoney(spotPurchaseCost)} - ${formatMoney(futureCost)} = ${formatMoney(savingsWithFuture)}`,
      ] : []),
    ],
    interpretation: `El precio futuro teorico es ${formatMoney(theoreticalPrice)} por unidad, dando un costo total comprometido de ${formatMoney(futureCost)}. ${savingsWithFuture > 0 ? `La cobertura con futuro genera un ahorro de ${formatMoney(savingsWithFuture)} vs comprar en spot al vencimiento.` : `Comprar en spot habria sido mas barato por ${formatMoney(-savingsWithFuture)}.`}`,
    examExplanation: "1) Calcula el precio futuro. 2) Con el futuro fijas el precio de compra HOY aunque pagues al vencimiento. 3) Compara contra lo que habria costado comprar en spot al vencimiento para medir el beneficio de la cobertura.",
    warnings,
  };
}
