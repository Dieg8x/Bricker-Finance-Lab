import type { CalculationInput, CalculationResult } from "../types";
import { calculateFRA } from "./fra";
import { calculateForwardFX, calculateForwardRate } from "./forwards";
import { calculateCommodityFuture, calculateFutureContracts, calculateIndexFuture, calculateSimpleFuture, calculateStockFuture } from "./futures";
import { calculateBinomialOption, calculateBlackScholes } from "./options";
import { calculatePayoffWithPremium, calculatePayoffWithoutPremium } from "./payoffs";
import { calculateWiredRate } from "./rates";
import { calculateComparativeAdvantage, calculateSimpleSwap } from "./swaps";
import { calculateSyntheticDerivative } from "./syntheticDerivatives";

export const calculators: Record<string, (input: CalculationInput) => CalculationResult> = {
  simple_swap: calculateSimpleSwap,
  general_swap: calculateSimpleSwap,
  comparative_advantage: calculateComparativeAdvantage,
  future_fra_basic: calculateFutureContracts,
  index_future: calculateIndexFuture,
  payoff_without_premium: calculatePayoffWithoutPremium,
  payoff_with_premium: calculatePayoffWithPremium,
  stock_future: calculateStockFuture,
  commodity_future: calculateCommodityFuture,
  simple_future: calculateSimpleFuture,
  forward_fx: calculateForwardFX,
  forward_rate: calculateForwardRate,
  wired_rates: calculateWiredRate,
  fra_calculator: calculateFRA,
  options_greeks: calculateBlackScholes,
  binomial_option: calculateBinomialOption,
  synthetic_derivatives: calculateSyntheticDerivative,
};
