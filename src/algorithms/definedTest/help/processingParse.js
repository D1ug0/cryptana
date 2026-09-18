import Big from "big.js";

const safePositiveBig = (value) => {
  try {
    const result = new Big(value ?? 0).abs();
    return result.gt(0) ? result : null;
  } catch {
    return null;
  }
};

export const processingParse = (items) => {
  const makerData = {};

  items.forEach((item) => {
    const { maker, eventDisplayType, data } = { ...item };
    const priceUsdTotal = safePositiveBig(data?.priceUsdTotal);
    const tokenQuantity = safePositiveBig(data?.amountNonLiquidityToken);

    if (!maker || !priceUsdTotal || !tokenQuantity) {
      return;
    }

    makerData[maker] = makerData[maker] || {
      totalBuy: new Big(0),
      totalSell: new Big(0),
      tokenBalance: new Big(0),
      buyCount: 0,
      sellCount: 0,
    };

    const makerEntry = { ...makerData[maker] };

    if (eventDisplayType === "Buy") {
      makerEntry.totalBuy = makerEntry.totalBuy.plus(priceUsdTotal);
      makerEntry.tokenBalance = makerEntry.tokenBalance.plus(tokenQuantity);
      makerEntry.buyCount += 1;
      makerData[maker] = makerEntry;
    } else if (eventDisplayType === "Sell" && makerEntry.tokenBalance.gt(0)) {
      const matchedQuantity = tokenQuantity.lte(makerEntry.tokenBalance)
        ? tokenQuantity
        : makerEntry.tokenBalance;
      const matchedSaleUsd = priceUsdTotal.times(
        matchedQuantity.div(tokenQuantity)
      );

      makerEntry.totalSell = makerEntry.totalSell.plus(matchedSaleUsd);
      makerEntry.tokenBalance = makerEntry.tokenBalance.minus(matchedQuantity);
      makerEntry.sellCount += 1;
      makerData[maker] = makerEntry;
    }
  });

  const resultArray = Object.keys(makerData)
    .filter((maker) => makerData[maker].buyCount > 0)
    .map((maker) => {
      let obj = {
        ...makerData[maker],
      };

      return {
        maker,
        totalBuy: obj.totalBuy,
        totalSell: obj.totalSell,
        buyCount: obj.buyCount,
        sellCount: obj.sellCount,
      };
    });

  const onlyPositives = resultArray.filter(
    (item) => item.totalSell.gte(item.totalBuy)
  );

  onlyPositives.sort((a, b) =>
    b.totalSell.div(b.totalBuy).cmp(a.totalSell.div(a.totalBuy))
  );

  return onlyPositives;
};

// Пример использования
// const response = require("../testJson/test.json");
// const items = response;
// const resultArray = processingParse(items);
// console.log(resultArray);
