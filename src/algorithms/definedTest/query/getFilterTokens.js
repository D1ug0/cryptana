import { DefinedApiHandler } from "../../../api/defined.api.js";
import { sleep } from "../../../helpers/utils.js";

export const getFilterTokens = async (
  timestamp,
  offset = 0,
  accumulatedResults = []
) => {
  const query = `query {
    filterTokens(
      limit: 200
      offset: ${offset}
      filters: { createdAt: { gte: ${timestamp} }, network: 1, liquidity: { gt: 50000 }, marketCap: { gt: 500000 } }
    ) {
      count
      page
      results {
        token {
          address
          createdAt
          symbol
          name
        }
        marketCap
      }
    }
  }`;

  try {
    await sleep(200);
    const response = await DefinedApiHandler.getFilterTokens({ query });
    const { count, page, results } = response.data.filterTokens;
    const filteredResults = results.filter(
      (item) => item.token.createdAt !== null
    );
    const updatedResults = [...accumulatedResults, ...filteredResults];

    if (count < 200) {
      return updatedResults;
    } else {
      return await getFilterTokens(timestamp, count + page, updatedResults);
    }
  } catch (e) {
    console.log("Возникла ошибка в рекурсии filterTokens", e.message);
    return accumulatedResults;
  }
};

export const getTokensVolumeAndLiquidity = async ({ batchObjects }) => {
  const query = `query {
        filterTokens(
          filters: {
            network: [1]
          }
          limit: 200
          tokens: ${JSON.stringify(batchObjects).replace(
            /"([^(")"]+)":/g,
            "$1:"
          )}
        ) {
          results {
            lastTransaction
            volume24
            liquidity
            priceUSD
            token {
              address
              symbol
            }
          }
        }
      }`;

  try {
    const response = await DefinedApiHandler.getFilterTokens({
      query,
    });

    return response?.data?.filterTokens;
  } catch (e) {
    throw new Error(`Failed to load token liquidity: ${e.message}`);
  }
};
