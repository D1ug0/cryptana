import { DefinedApiHandler } from "../../../api/defined.api.js";

export const getTokenEvents = async ({
  pairAddress,
  startTimestamp,
  endTimestamp,
  cursor = "",
}) => {
  const query = `query {
        getTokenEvents(
          query: {address: "${pairAddress}", networkId: 1, timestamp: {from: ${startTimestamp}, to: ${endTimestamp}}, eventType: Swap }
          limit: 200
          direction: ASC
          cursor: "${cursor}"
        ) {
          items {
            maker
            token0SwapValueUsd
            token0PoolValueUsd
            timestamp
            transactionHash
            token1ValueBase
            eventType
            eventDisplayType
            data {
              ... on SwapEventData {
                amount0
                amount0In
                amount0Out
                amount1
                amount1In
                amountNonLiquidityToken
                amount1Out
                priceBaseToken
                priceBaseTokenTotal
                priceUsd
                priceUsdTotal
                tick
                type
              }
            }
          }
          cursor
        }
      }
    `;
  const response = await DefinedApiHandler.getTokenEvents({ query });
  const result = response.data.getTokenEvents;

  if (!result) {
    throw new Error(`Defined returned no events for pair ${pairAddress}`);
  }

  return { cursor: result.cursor, items: result.items ?? [] };
};
