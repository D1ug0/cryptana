import { DefinedApiHandler } from "../../../api/defined.api.js";

export const getTokenPrices = async ({ batchObjects }) => {
  const query = `query {
      getTokenPrices(inputs: ${JSON.stringify(batchObjects).replace(
        /"([^(")"]+)":/g,
        "$1:"
      )}) {
        address
        networkId
        priceUsd
        timestamp
      }
    }`;

  const response = await DefinedApiHandler.getTokenPrices({ query });
  return response.data.getTokenPrices ?? [];
};
