import { calculators } from "../src/lib/calculators";

function assertClose(name: string, actual: number, expected: number, tolerance = 0.02) {
  const diff = Math.abs(actual - expected);
  if (diff > tolerance) {
    throw new Error(`${name}: esperado ${expected}, recibido ${actual}, diferencia ${diff}`);
  }
  console.log(`OK ${name}: ${actual}`);
}

const commodity = calculators.commodity_future({
  spot: 59,
  days: 120,
  riskFreeRate: 0.0681,
});
assertClose("commodity future", Number(commodity.results.futurePrice), 60.3393, 0.001);

const stock = calculators.stock_future({
  spot: 40,
  days: 180,
  riskFreeRate: 0.0681,
  dividend: 2,
  dividendDays: 90,
});
assertClose("stock future", Number(stock.results.futurePrice), 39.3285, 0.01);

const fx = calculators.forward_fx({
  days: 90,
  spotBuy: 17.1,
  spotSell: 17.3,
  domesticPassive: 0.07,
  domesticActive: 0.072,
  foreignPassive: 0.045,
  foreignActive: 0.047,
});
assertClose("fx buy forward", Number(fx.results.buyForward), 17.1973, 0.01);

const rate = calculators.forward_rate({
  shortDays: 182,
  longDays: 364,
  shortRate: 0.0685,
  longRate: 0.0719,
});
assertClose("forward rate", Number(rate.results.forwardRate), 0.07278, 0.0001);

const swap = calculators.simple_swap({
  notional: 250000,
  fixedRate: 0.1,
  variableRate: 0.070172,
  spread: 0.2,
  frequency: 1,
  periods: 12,
  discountRate: 0.070172,
  position: "receiveFixed",
});
assertClose("swap fixed payment", Number(swap.results.fixedPayment), 25000, 0.01);
assertClose("swap variable payment", Number(swap.results.variablePayment), 67543, 0.01);

console.log("Validación de calculadoras terminada.");
