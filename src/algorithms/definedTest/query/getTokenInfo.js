import { DefinedApiHandler } from "../../../api/defined.api.js";

export const isTokenNotFoundError = (error) =>
  /token not found/i.test(error?.message ?? "");

export const getTokenInfo = async (contract) => {
  const query = `query {
      token(input: { address: "${contract}", networkId: 1 }) {
        createdAt
      }
    }`;

  try {
    const response = await DefinedApiHandler.getTokenInfo({ query });
    return response.data.token?.createdAt ?? null;
  } catch (error) {
    if (isTokenNotFoundError(error)) {
      return null;
    }

    throw error;
  }
};
