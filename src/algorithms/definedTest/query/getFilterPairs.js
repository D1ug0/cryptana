import { DefinedApiHandler } from "../../../api/defined.api.js";

const PAGE_SIZE = 200;

const loadPairsPage = async (tokenAddress, offset) => {
  const query = `query {
    filterPairs(
      pairs: ${JSON.stringify([`${tokenAddress}:1`]).replace(
        /"([^(")"]+)":/g,
        "$1:"
      )}
      limit: ${PAGE_SIZE}
      offset: ${offset}
    ) {
      results {
        pair {
          address
          createdAt
        }
        token0 {
          address
          decimals
          symbol
        }
        token1 {
          address
          decimals
          symbol
        }
      }
    }
  }`;

  const response = await DefinedApiHandler.getPairsForToken({ query });
  return response.data.filterPairs?.results ?? [];
};

export const getPairsForToken = async ({ tokenAddress }) => {
  const results = [];
  const seenPairs = new Set();
  let offset = 0;

  while (true) {
    const page = await loadPairsPage(tokenAddress, offset);

    for (const result of page) {
      if (result.pair?.address && !seenPairs.has(result.pair.address)) {
        seenPairs.add(result.pair.address);
        results.push(result);
      }
    }

    if (page.length < PAGE_SIZE) {
      break;
    }

    offset += page.length;
  }

  if (!results.length) {
    throw new Error(`No trading pairs found for token ${tokenAddress}`);
  }

  const normalizedAddress = tokenAddress.toLowerCase();
  const matchingToken = [results[0].token0, results[0].token1].find(
    (token) => token?.address?.toLowerCase() === normalizedAddress
  );

  return {
    pairs: results.map((result) => {
      const targetTokenIndex =
        result.token0?.address?.toLowerCase() === normalizedAddress ? 0 : 1;
      const targetToken =
        targetTokenIndex === 0 ? result.token0 : result.token1;

      return {
        ...result.pair,
        targetTokenIndex,
        targetTokenDecimals: Number(targetToken?.decimals ?? 0),
      };
    }),
    symbol: matchingToken?.symbol ?? "UNKNOWN",
  };
};
