//! старый файл prepTokens

// import Big from "big.js";
// import { toFixedNumber } from "../helpers/utils";
// import { noValueAddObject } from "./noValueAddObject";

// export const prepareTokenInfo = (data) => {
//   const ticker = data.tokenSymbol;

//   let totalBuy = { orders: 0, tokens: new Big(0), sumUSD: new Big(0) };
//   let totalSell = { orders: 0, tokens: new Big(0), sumUSD: new Big(0) };
//   let feeUSD = new Big(0);

//   const calculateQuantity = (direction) =>
//     direction
//       .filter((d) => d.quantity.numeric && d.fungible_info.symbol === ticker)
//       .reduce((p, n) => p.plus(new Big(n.quantity.numeric)), new Big(0));

//   const calculateValue = (direction, alt) => {
//     const reducer = (arr, type) =>
//       arr.reduce((p, n) => {
//         (type === "Y" && n.value && n.fungible_info.symbol === ticker) ||
//           (type === "N" && n.value && n.fungible_info.symbol !== ticker) ||
//           n.value;
//         return p.plus(new Big(n.value || 0));
//       }, new Big(0));

//     return direction.find((d) => d.value) &&
//       !alt.find((a) => a.fungible_info.symbol !== ticker)
//       ? reducer(direction)
//       : !alt.find((a) => a.value && a.fungible_info.symbol !== ticker)
//       ? reducer(alt, "Y")
//       : direction.find((a) => a.value)
//       ? reducer(direction, "N").minus(reducer(alt, "N"))
//       : reducer(alt, "Y");
//   };

//   const processBuy = (tokenIn, tokenOut, fee) => {
//     const buyQuantity = calculateQuantity(tokenIn, tokenOut);
//     totalBuy = {
//       orders: totalBuy.orders + 1,
//       tokens: totalBuy.tokens.plus(buyQuantity),
//       sumUSD: totalBuy.sumUSD.plus(calculateValue(tokenOut, tokenIn)),
//     };
//     feeUSD = feeUSD.plus(new Big(fee || 0));
//   };

//   const processSell = (tokenOut, tokenIn, fee) => {
//     const sellQuantity = calculateQuantity(tokenOut, tokenIn);
//     const totalTokensDifference = totalBuy.tokens.minus(totalSell.tokens);

//     if (totalTokensDifference.gte(sellQuantity)) {
//       totalSell = {
//         orders: totalSell.orders + 1,
//         tokens: totalSell.tokens.plus(sellQuantity),
//         sumUSD: totalSell.sumUSD.plus(calculateValue(tokenIn, tokenOut)),
//       };
//       feeUSD = feeUSD.plus(new Big(fee || 0));
//     } else {
//       console.log("На продажу больше чем было куплено: ", ticker);
//       const sellValue = calculateValue(tokenIn, tokenOut);

//       feeUSD = totalTokensDifference
//         .div(sellQuantity)
//         .times(new Big(fee || 0))
//         .plus(feeUSD);

//       totalSell = {
//         orders: totalSell.orders + 1,
//         tokens: totalBuy.tokens,
//         sumUSD: totalTokensDifference
//           .div(sellQuantity)
//           .times(sellValue)
//           .plus(totalSell.sumUSD),
//       };
//     }
//   };

//   for (let i = data.transactions.length - 1; i >= 0; i--) {
//     const { attributes } = data.transactions[i];
//     const fee = attributes.fee.value;

//     if (!fee) {
//       noValueAddObject(
//         "fee",
//         data.tokenContract,
//         new Big(attributes.fee.quantity.numeric),
//         attributes.fee.fungible_info.implementations.find(
//           (i) => i.chain_id === "ethereum"
//         ).address || "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
//         attributes.mined_at
//       );
//     }

//     const tokenIn = attributes.transfers.filter((t) => t.direction === "in");
//     const tokenOut = attributes.transfers.filter((t) => t.direction === "out");

//     const symbol = tokenIn.find((t) => t.fungible_info.symbol === ticker)
//       ? ticker
//       : attributes.transfers[0].fungible_info.symbol;

//     symbol === ticker
//       ? processBuy(tokenIn, tokenOut, fee)
//       : processSell(tokenOut, tokenIn, fee);
//   }

//   const deltaTokens = totalBuy.tokens.minus(totalSell.tokens);

//   if (deltaTokens > 1) {
//     noValueAddObject("accum", data.tokenContract, deltaTokens, null, null);
//   }

//   const deltaUSD = totalSell.sumUSD.minus(totalBuy.sumUSD).minus(feeUSD);

//   const deltaPercentage = deltaUSD.div(totalBuy.sumUSD).times(100);

//   return {
//     ticker,
//     tokenContract: data.tokenContract,
//     totalBuy: {
//       orders: totalBuy.orders,
//       tokens: toFixedNumber(totalBuy.tokens),
//       sumUSD: toFixedNumber(totalBuy.sumUSD),
//     },
//     totalSell: {
//       orders: totalSell.orders,
//       tokens: toFixedNumber(totalSell.tokens),
//       sumUSD: toFixedNumber(totalSell.sumUSD),
//     },
//     feeUSD: toFixedNumber(feeUSD),
//     delta: {
//       deltaTokens: toFixedNumber(deltaTokens),
//       accumPrice: null,
//       deltaUSD: toFixedNumber(deltaUSD),
//       deltaPercentage: toFixedNumber(
//         Number(deltaPercentage) > -100 ? deltaPercentage : -100
//       ),
//     },
//     lastOrderTime: data.transactions[0].attributes.mined_at,
//   };
// };

//! старая функция получения отсутствующих значений

// async function getTokenPrice(contractAddress, deltaTokens) {
//   try {
//     const response = await fetch(
//       `https://api.zerion.io/v1/fungibles/${contractAddress}/charts/max`,
//       options
//     );
//     const data = await response.json();

//     if (data.data) {
//       return deltaTokens.times(new Big(data.data.attributes.stats.last));
//     } else {
//       console.log("SCAM: ", contractAddress); // тут нужно будет записывать в базу адреса скам или недоступных монет
//       return 0;
//     }
//   } catch (error) {
//     console.log("SCAM: ", contractAddress); // тут нужно будет записывать в базу адреса скам или недоступных монет
//     return 0;
//   }
// }

// const allTickers = await Ticker.findAll();
// for (const token of allTickers) {
//   await sleep(1000);
//   const released = await getTokenInfo(token.contract);
//   if (released !== 0 && released !== null)
//     await Ticker.update(
//       {
//         released: new Date(released * 1000).getTime(),
//       },
//       { where: { contract: token.contract } }
//     );
//   console.log(token.contract, new Date(released).getTime());
// }
