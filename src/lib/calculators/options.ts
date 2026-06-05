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
  const t = days / 360;
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(spot / strike) + (rate + volatility ** 2 / 2) * t) / (volatility * sqrtT);
  const d2 = d1 - volatility * sqrtT;
  const nd1 = normalCdf(d1);
  const nd2 = normalCdf(d2);
  const nMinusD1 = normalCdf(-d1);
  const nMinusD2 = normalCdf(-d2);
  const discountStrike = strike * Math.exp(-rate * t);
  const call = spot * nd1 - discountStrike * nd2;
  const put = discountStrike * nMinusD2 - spot * nMinusD1;
  const gamma = normalPdf(d1) / (spot * volatility * sqrtT);
  const vega = spot * normalPdf(d1) * sqrtT / 100;
  const thetaCall = (-(spot * normalPdf(d1) * volatility) / (2 * sqrtT) - rate * discountStrike * nd2) / 360;
  const thetaPut = (-(spot * normalPdf(d1) * volatility) / (2 * sqrtT) + rate * discountStrike * nMinusD2) / 360;
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
      { key: "deltaCall", label: "Delta call", value: nd1 },
      { key: "deltaPut", label: "Delta put", value: nd1 - 1 },
      { key: "gamma", label: "Gamma", value: gamma },
      { key: "vega", label: "Vega", value: vega },
      { key: "thetaCall", label: "Theta call", value: thetaCall },
      { key: "rhoCall", label: "Rho call", value: rhoCall },
    ],
    formula: "d1=[ln(S/K)+(r+σ²/2)t]/[σ√t]; d2=d1-σ√t; Call=S N(d1)-K e^(-rt) N(d2)",
    steps: [
      `t = ${days}/360 = ${formatNumber(t, 4)} años`,
      `d1 = [ln(${spot}/${strike}) + (${formatPercent(rate)} + ${formatPercent(volatility)}²/2) × ${formatNumber(t, 4)}] / [${formatPercent(volatility)} × √${formatNumber(t, 4)}] = ${formatNumber(d1, 4)}`,
      `d2 = ${formatNumber(d1, 4)} - ${formatPercent(volatility)} × √${formatNumber(t, 4)} = ${formatNumber(d2, 4)}`,
      `Call = ${formatMoney(call)}; Put = ${formatMoney(put)}`,
    ],
    interpretation: `El call vale ${formatMoney(call)} y el put vale ${formatMoney(put)} bajo Black-Scholes. Delta call es ${formatNumber(nd1, 4)}.`,
    examExplanation: "Convertimos el plazo a años, calculamos d1 y d2, buscamos sus probabilidades normales acumuladas y aplicamos Black-Scholes para call y put.",
    warnings,
  };
}
