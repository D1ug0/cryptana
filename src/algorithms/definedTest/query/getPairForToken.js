import { DefinedApiHandler } from "../../../api/defined.api.js";

export const getPairForToken = async ({ tokenAddress }) => {
  const query = `query {
        listPairsForToken(
          networkId: 1
          tokenAddress: "${tokenAddress}"
          limit: 1
        ) {
          address
          createdAt
        }
      }
    `;
  const response = await DefinedApiHandler.getPairForToken({ query });
  const pair = response.data.listPairsForToken?.[0];

  if (!pair) {
    throw new Error(`No trading pair found for token ${tokenAddress}`);
  }

  return { address: pair.address, createdAt: pair.createdAt };
};
