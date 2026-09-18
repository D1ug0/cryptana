import Big from "big.js";

const toBig = (value) => {
  try {
    return new Big(value ?? 0);
  } catch {
    return new Big(0);
  }
};

export const hasMinimumReturnMultiple = (item, multiple = 2) => {
  const totalBuy = toBig(item?.totalBuy);
  const totalSell = toBig(item?.totalSell);

  return totalBuy.gt(0) && totalSell.gte(totalBuy.times(multiple));
};

export const selectProfitableWallets = (items, multiple = 2) =>
  items.filter((item) => hasMinimumReturnMultiple(item, multiple));
