import { DefinedApiHandler } from "../../../api/defined.api.js";

export const getListTopTokens = async () => {
  const query = `query {
    listTopTokens(limit: 500, networkFilter: 1) {
      address
      symbol
      createdAt
      decimals
      isScam
      volume
      liquidity
      lastTransaction
      marketCap
    }
  }`;

  const response = await DefinedApiHandler.getTopTradeTokens({ query });

  const currentTimestamp = Math.floor(Date.now() / 1000);
  const threeMonthsInSeconds = 3 * 30 * 24 * 60 * 60;

  return (response.data.listTopTokens ?? []).filter((token) => {
    const differenceInSeconds = currentTimestamp - token.createdAt;
    return (
      differenceInSeconds <= threeMonthsInSeconds &&
      !token.isScam &&
      token.liquidity > 50000 &&
      token.marketCap > 500000
    );
  });
};
