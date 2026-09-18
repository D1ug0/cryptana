import Big from "big.js";
import { calculateTimeDifference, toFixedNumber } from "../helpers/utils.js";
import { noValueAddObject } from "./noValueAddObject.js";

export const prepareTokenInfo = (ctx, isNoAlgoState, data) => {
  const ticker = data.tokenSymbol;
  let filstOrderTime = null;

  let totalBuy = { orders: 0, tokens: new Big(0), sumUSD: new Big(0) };
  let totalSell = { orders: 0, tokens: new Big(0), sumUSD: new Big(0) };
  let feeUSD = new Big(0);

  const calculateQuantity = (direction) =>
    direction
      .filter((d) => d.quantity.numeric && d.fungible_info.symbol === ticker)
      .reduce((p, n) => p.plus(new Big(n.quantity.numeric)), new Big(0));

  const calculateValue = (direction, alt) => {
    const reducer = (arr, type) => {
      return arr.reduce((p, n) => {
        if (
          (type === "Y" && n.value && n.fungible_info.symbol === ticker) ||
          (type === "N" && n.value && n.fungible_info.symbol !== ticker) ||
          (type === "D" && n.fungible_info.symbol === ticker) ||
          (!type && n.value)
        ) {
          return p.plus(new Big(n.value || 0));
        } else {
          return p.plus(new Big(0));
        }
      }, new Big(0));
    };

    return direction.find((d) => d.value) &&
      !alt.find((a) => a.fungible_info.symbol !== ticker)
      ? reducer(direction)
      : !alt.find((a) => a.value && a.fungible_info.symbol !== ticker)
      ? alt.find(
          (a) =>
            (a.fungible_info.symbol.includes(ticker) &&
              a.fungible_info.symbol.length > ticker.length) ||
            (a.fungible_info.symbol.toLowerCase().includes("dividend") &&
              !ticker.toLowerCase().includes("dividend"))
        )
        ? reducer(direction, "N")
        : reducer(alt, "Y")
      : alt.find(
          (a) =>
            (ticker.includes(a.fungible_info.symbol) &&
              a.fungible_info.symbol !== ticker) ||
            (ticker.toLowerCase().includes("dividend") &&
              !a.fungible_info.symbol.toLowerCase().includes("dividend"))
        )
      ? reducer(alt, "D")
      : direction.find((a) => a.value)
      ? reducer(direction, "N").minus(reducer(alt, "N"))
      : reducer(alt, "Y");
  };

  const processBuy = (tokenIn, tokenOut, fee, mined_at) => {
    if (!filstOrderTime) {
      filstOrderTime = mined_at;
    }
    const buyQuantity = calculateQuantity(tokenIn, tokenOut);
    totalBuy = {
      orders: totalBuy.orders + 1,
      tokens: totalBuy.tokens.plus(buyQuantity),
      sumUSD: totalBuy.sumUSD.plus(calculateValue(tokenOut, tokenIn)),
    };
    if (
      !tokenIn.find(
        (a) =>
          (ticker.includes(a.fungible_info.symbol) &&
            a.fungible_info.symbol !== ticker) ||
          (ticker.toLowerCase().includes("dividend") &&
            !a.fungible_info.symbol.toLowerCase().includes("dividend"))
      )
    ) {
      feeUSD = feeUSD.plus(new Big(fee || 0));
    }
  };

  const processSell = (tokenOut, tokenIn, fee) => {
    const sellQuantity = calculateQuantity(tokenOut, tokenIn);
    const totalTokensDifference = totalBuy.tokens.minus(totalSell.tokens);

    if (totalTokensDifference.gte(sellQuantity)) {
      totalSell = {
        orders: totalSell.orders + 1,
        tokens: totalSell.tokens.plus(sellQuantity),
        sumUSD: totalSell.sumUSD.plus(calculateValue(tokenIn, tokenOut)),
      };
      if (
        !tokenOut.find(
          (a) =>
            (ticker.includes(a.fungible_info.symbol) &&
              a.fungible_info.symbol !== ticker) ||
            (ticker.toLowerCase().includes("dividend") &&
              !a.fungible_info.symbol.toLowerCase().includes("dividend"))
        )
      ) {
        feeUSD = feeUSD.plus(new Big(fee || 0));
      }
    } else {
      const sellValue = calculateValue(tokenIn, tokenOut);

      if (
        !tokenOut.find(
          (a) =>
            (ticker.includes(a.fungible_info.symbol) &&
              a.fungible_info.symbol !== ticker) ||
            (ticker.toLowerCase().includes("dividend") &&
              !a.fungible_info.symbol.toLowerCase().includes("dividend"))
        )
      ) {
        feeUSD = totalTokensDifference
          .div(sellQuantity)
          .times(new Big(fee || 0))
          .plus(feeUSD);
      }

      totalSell = {
        orders: totalSell.orders + 1,
        tokens: totalBuy.tokens,
        sumUSD: totalTokensDifference
          .div(sellQuantity)
          .times(sellValue)
          .plus(totalSell.sumUSD),
      };
    }
  };

  for (let i = data.transactions.length - 1; i >= 0; i--) {
    const { attributes } = data.transactions[i];
    const fee = attributes.fee.value;
    const mined_at = attributes.mined_at;

    if (!fee) {
      noValueAddObject(
        ctx,
        isNoAlgoState,
        "fee",
        data.tokenContract,
        new Big(attributes.fee.quantity.numeric),
        attributes.fee.fungible_info.implementations.find(
          (i) => i.chain_id === "ethereum"
        ).address || "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        attributes.mined_at
      );
    }

    const tokenIn = attributes.transfers.filter((t) => t.direction === "in");
    const tokenOut = attributes.transfers.filter((t) => t.direction === "out");

    const symbol = tokenIn.find((t) => t.fungible_info.symbol === ticker)
      ? ticker
      : attributes.transfers[0].fungible_info.symbol;

    symbol === ticker
      ? processBuy(tokenIn, tokenOut, fee, mined_at)
      : processSell(tokenOut, tokenIn, fee);
  }

  const deltaTokens = totalBuy.tokens.minus(totalSell.tokens);

  if (deltaTokens > 0) {
    noValueAddObject(
      ctx,
      isNoAlgoState,
      "accum",
      data.tokenContract,
      deltaTokens,
      null,
      null
    );
  }

  const deltaUSD = totalSell.sumUSD.minus(totalBuy.sumUSD).minus(feeUSD);

  const deltaPercentage =
    toFixedNumber(deltaUSD) !== 0 && toFixedNumber(totalBuy.sumUSD) !== 0
      ? deltaUSD.div(totalBuy.sumUSD).times(100)
      : 0;

  const { forCalc, forDisplay } = calculateTimeDifference(
    filstOrderTime,
    data.transactions[0].attributes.mined_at
  );

  return {
    ticker,
    tokenContract: data.tokenContract,
    totalBuy: {
      orders: totalBuy.orders,
      tokens: toFixedNumber(totalBuy.tokens, 3),
      sumUSD: toFixedNumber(totalBuy.sumUSD),
    },
    totalSell: {
      orders: totalSell.orders,
      tokens: toFixedNumber(totalSell.tokens, 3),
      sumUSD: toFixedNumber(totalSell.sumUSD),
    },
    feeUSD: toFixedNumber(feeUSD),
    delta: {
      deltaTokens: toFixedNumber(deltaTokens, 3),
      accumPrice: null,
      deltaUSD: toFixedNumber(deltaUSD),
      deltaPercentage: toFixedNumber(
        Number(deltaPercentage) > -100 ? deltaPercentage : -100
      ),
    },
    lastOrderTime: data.transactions[0].attributes.mined_at,
    tradesPeriod: forDisplay,
    allTradeTime: forCalc,
  };
};
