import { toFixedNumber } from "../helpers/utils.js";

export const remapAlgorithm = (fees, accumLiquidVolumes, preFinalArray) => {
  return preFinalArray.map((el) => {
    const feesObj = fees.find((uo) => uo.tokenContract === el.tokenContract);
    const accumLiqVolObj = accumLiquidVolumes.find(
      (uo) => uo.tokenContract === el.tokenContract
    );

    const feeUSD = el.feeUSD + (feesObj?.fee ?? 0);
    const accumPrice = accumLiqVolObj?.accum ?? 0;
    const newDeltaUSD =
      el.totalSell.sumUSD + accumPrice - el.totalBuy.sumUSD - feeUSD;
    const newDeltaPercentage =
      el.totalBuy.sumUSD > 0
        ? (newDeltaUSD / el.totalBuy.sumUSD) * 100
        : 0;

    return {
      ...el,
      feeUSD: toFixedNumber(feeUSD),
      delta: {
        ...el.delta,
        accumPrice: toFixedNumber(accumPrice),
        deltaUSD: toFixedNumber(newDeltaUSD),
        deltaPercentage:
          newDeltaPercentage > -100
            ? toFixedNumber(newDeltaPercentage)
            : -100,
      },
      ...(accumLiqVolObj
        ? {
            volume: accumLiqVolObj.volume,
            liquidity: accumLiqVolObj.liquidity,
          }
        : {}),
    };
  });
};
