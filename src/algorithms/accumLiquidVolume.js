import Big from "big.js";
import { toFixedNumber } from "../helpers/utils.js";
import { isTimestampDifferenceWithinDays } from "../helpers/time.js";
import { getTokensVolumeAndLiquidity } from "./definedTest/query/getFilterTokens.js";

export const accumLiquidVolume = async (ctx, isNoAlgoState, preFinalArray) => {
  const noValueObjectsKey = isNoAlgoState
    ? "noValueObjects"
    : "noValueObjectsAlgo";

  const allnoValueObjects = ctx?.session?.[noValueObjectsKey]
    ? [...ctx.session[noValueObjectsKey]]
    : [];

  const noValueObjects = allnoValueObjects.filter((el) => el.accums.length > 0);

  const accumsObjects = noValueObjects.flatMap((item) =>
    item.accums.map(({ ...rest }) => ({
      address: item.tokenContract,
      ...rest,
    }))
  );

  let contractAddressesArray;

  if (isNoAlgoState) {
    contractAddressesArray = preFinalArray.map((t) => t.tokenContract);
  } else {
    contractAddressesArray = accumsObjects.map((ao) => ao.address);
  }

  const batchSize = 200;

  const tokensResponse = [];

  // цикл выполнения запросов, которые получают цену
  for (let i = 0; i < contractAddressesArray.length; i += batchSize) {
    const batchObjects = contractAddressesArray.slice(i, i + batchSize);

    const filterTokens = await getTokensVolumeAndLiquidity({
      batchObjects,
    });

    tokensResponse.push(...(filterTokens?.results ?? []));
  }

  const updatedObjects = tokensResponse.map((resp, index) => {
    // создание экземпляра нового объекта
    const newObj = {
      tokenContract: resp.token.address,
      isScam: false,
      volume: 0,
      liquidity: 0,
      accum: new Big(0),
    };

    const respObj = tokensResponse[index];

    let isValid = false;

    if (respObj) {
      const isAccumIndex = accumsObjects.findIndex(
        (a) => a.address === respObj.token.address
      );
      const price = new Big(respObj.priceUSD || 0);
      const liquidity = Number(respObj.liquidity || 0);
      const accumulatedTokens = new Big(
        isAccumIndex === -1 ? 0 : accumsObjects[isAccumIndex]?.value || 0
      );
      const accumulatedUsd = accumulatedTokens.times(price);
      const recent = isTimestampDifferenceWithinDays(
        Math.floor(Date.now() / 1000) - Number(respObj.lastTransaction),
        14
      );
      const plausiblePrice = price.gt(0) && price.lt(1000000);
      const lowLiquidityPositionIsSafe =
        liquidity >= 500 || accumulatedTokens.eq(0) || accumulatedUsd.lt(10000);

      isValid = recent && plausiblePrice && lowLiquidityPositionIsSafe;

      if (isAccumIndex !== -1) {
        newObj.accum = isValid ? accumulatedUsd : new Big(0);
      }

      newObj.volume = toFixedNumber(respObj.volume24);
      newObj.liquidity = toFixedNumber(respObj.liquidity);
    }

    newObj.isScam = !isValid;

    return {
      ...newObj,
      accum: toFixedNumber(newObj.accum),
    };
  });

  return updatedObjects;
};
