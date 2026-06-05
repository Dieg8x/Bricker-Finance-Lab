import type { CalculationInput, CalculationResult } from "../types";
import { asNumber, formatMoney, formatNumber, formatPercent, normalizeRate } from "../formatters";
import { compactWarnings, requirePositive, requireRate } from "../validation";

function erf(x: number): number {
  const sign = x >= 0 ? 1 : -1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-absX * absX);
  return sign * y;
}

function normalCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.sqrt(2)));
}

function normalPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function calculateBlackScholes(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const strike = asNumber(input.strike);
  const rate = normalizeRate(input.riskFreeRate);
  const days = asNumber(input.days);
  const volatility = normalizeRate(input.volatility);
  const dividendYield = normalizeRate(input.dividendYield || 0); // Extension Merton
  const t = days / 360;
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(spot / strike) + (rate - dividendYield + volatility ** 2 / 2) * t) / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;
  const nd1 = normalCdf(d1);
  const nd2 = normalCdf(d2);
  const nMinusD1 = normalCdf(-d1);
  const nMinusD2 = normalCdf(-d2);
  const discountStrike = strike * Math.exp(-rate * t);
  const discountSpot = spot * Math.exp(-dividendYield * t);
  const call = discountSpot * nd1 - discountStrike * nd2;
  const put = discountStrike * nMinusD2 - discountSpot * nMinusD1;
  const gamma = (normalPdf(d1) * Math.exp(-dividendYield * t)) / (spot * volatility * sqrtT);
  const vega = discountSpot * normalPdf(d1) * sqrtT / 100;
  const thetaCall = (-(discountSpot * normalPdf(d1) * volatility) / (2 * sqrtT) + dividendYield * discountSpot * nd1 - rate * discountStrike * nd2) / 360;
  const thetaPut = (-(discountSpot * normalPdf(d1) * volatility) / (2 * sqrtT) - dividendYield * discountSpot * nMinusD1 + rate * discountStrike * nMinusD2) / 360;
  const rhoCall = strike * t * Math.exp(-rate * t) * nd2 / 100;
  const rhoPut = -strike * t * Math.exp(-rate * t) * nMinusD2 / 100;
  const warnings = compactWarnings([
    requirePositive(spot, "el spot"),
    requirePositive(strike, "el strike"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
    requirePositive(days, "el plazo"),
    requireRate(input.volatility, "la volatilidad"),
  ]);

  return {
    results: { d1, d2, nd1, nd2, call, put, gamma, vega, thetaCall, thetaPut, rhoCall, rhoPut },
    metrics: [
      { key: "call", label: "Call", value: call, unit: "$", emphasis: true },
      { key: "put", label: "Put", value: put, unit: "$", emphasis: true },
      { key: "d1", label: "d1", value: d1 },
      { key: "d2", label: "d2", value: d2 },
      { key: "deltaCall", label: "Delta call", value: Math.exp(-dividendYield * t) * nd1 },
      { key: "deltaPut", label: "Delta put", value: Math.exp(-dividendYield * t) * (nd1 - 1) },
      { key: "gamma", label: "Gamma", value: gamma },
      { key: "vega", label: "Vega", value: vega },
      { key: "thetaCall", label: "Theta call", value: thetaCall },
      { key: "rhoCall", label: "Rho call", value: rhoCall },
    ],
    formula: "d1=[ln(S/K)+(r-q+σ²/2)t]/[σ√t]; d2=d1-σ√t; Call=S e^(-qt) N(d1)-K e^(-rt) N(d2)",
    steps: [
      `t = ${days}/360 = ${formatNumber(t, 4)} años`,
      `d1 = [ln(${spot}/${strike}) + (${formatPercent(rate)} - ${formatPercent(dividendYield)} + ${formatPercent(volatility)}²/2) × ${formatNumber(t, 4)}] / [${formatPercent(volatility)} × √${formatNumber(t, 4)}] = ${formatNumber(d1, 4)}`,
      `d2 = ${formatNumber(d1, 4)} - ${formatPercent(volatility)} × √${formatNumber(t, 4)} = ${formatNumber(d2, 4)}`,
      `Call = ${formatMoney(call)}; Put = ${formatMoney(put)}`,
    ],
    interpretation: `El call vale ${formatMoney(call)} y el put vale ${formatMoney(put)} bajo Black-Scholes. Delta call es ${formatNumber(nd1, 4)}.`,
    examExplanation: "Convertimos el plazo a años, calculamos d1 y d2, buscamos sus probabilidades normales acumuladas y aplicamos Black-Scholes para call y put.",
    warnings,
  };
}

export function calculateBinomialOption(input: CalculationInput): CalculationResult {
  const spot = asNumber(input.spot);
  const strike = asNumber(input.strike);
  const rate = normalizeRate(input.riskFreeRate);
  const days = asNumber(input.days);
  const upFactor = asNumber(input.upFactor);
  const downFactor = asNumber(input.downFactor);
  const optionType = String(input.optionType);
  const t = days / 360;
  const growth = Math.exp(rate * t);
  const probability = (growth - downFactor) / (upFactor - downFactor);
  const upSpot = spot * upFactor;
  const downSpot = spot * downFactor;
  const upPayoff = optionType === "put" ? Math.max(strike - upSpot, 0) : Math.max(upSpot - strike, 0);
  const downPayoff = optionType === "put" ? Math.max(strike - downSpot, 0) : Math.max(downSpot - strike, 0);
  const optionPrice = Math.exp(-rate * t) * (probability * upPayoff + (1 - probability) * downPayoff);
  const warnings = compactWarnings([
    requirePositive(spot, "el spot"),
    requirePositive(strike, "el strike"),
    requireRate(input.riskFreeRate, "la tasa libre de riesgo"),
    requirePositive(days, "el plazo"),
    requirePositive(upFactor, "el factor de alza"),
    requirePositive(downFactor, "el factor de baja"),
    upFactor <= downFactor ? "El factor de alza debe ser mayor al factor de baja." : null,
    probability < 0 || probability > 1 ? "La probabilidad neutral al riesgo salió fuera de 0 a 1; revisa u, d y tasa." : null,
  ]);

  return {
    results: { probability, upPayoff, downPayoff, optionPrice },
    metrics: [
      { key: "optionPrice", label: "Precio binomial", value: optionPrice, unit: "$", emphasis: true },
      { key: "probability", label: "Probabilidad neutral", value: probability },
      { key: "upPayoff", label: "Payoff al alza", value: upPayoff, unit: "$" },
      { key: "downPayoff", label: "Payoff a la baja", value: downPayoff, unit: "$" },
    ],
    formula: "P = e^(-Rf t)[pλu + (1-p)λd]; p=(e^(Rf t)-d)/(u-d)",
    steps: [
      `p = (e^(${formatPercent(rate)} × ${formatNumber(t, 4)}) - ${formatNumber(downFactor, 4)}) / (${formatNumber(upFactor, 4)} - ${formatNumber(downFactor, 4)}) = ${formatNumber(probability, 4)}`,
      `Payoff al alza = ${formatMoney(upPayoff)}; payoff a la baja = ${formatMoney(downPayoff)}`,
      `P = e^(-${formatPercent(rate)} × ${formatNumber(t, 4)}) × [${formatNumber(probability, 4)} × ${formatMoney(upPayoff)} + (1-p) × ${formatMoney(downPayoff)}]`,
      `P = ${formatMoney(optionPrice)}`,
    ],
    interpretation: `La opción ${optionType === "put" ? "put" : "call"} vale aproximadamente ${formatMoney(optionPrice)} con un árbol binomial de un periodo.`,
    examExplanation: "Primero calculamos la probabilidad neutral al riesgo, luego los payoffs en escenario de alza y baja, y finalmente descontamos el valor esperado.",
    warnings,
  };
}
