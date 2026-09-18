import { sleep } from "../helpers/utils.js";
import { $apiDefined } from "./config.js";

const MAX_ATTEMPTS = 5;

const retryDelay = (error, attempt) => {
  const retryAfter = Number(error.response?.headers?.["retry-after"]);
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return retryAfter * 1000;
  }

  return Math.min(500 * 2 ** (attempt - 1), 8000);
};

const isRetryable = (error) => {
  if (error.isGraphQLError) {
    return false;
  }
  const status = error.response?.status;
  return !status || status === 429 || status >= 500;
};

const execute = async (query, operation) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const { data } = await $apiDefined.post("", { query });

      if (data.errors?.length) {
        const details = data.errors.map((error) => error.message).join("; ");
        const error = new Error(`Defined ${operation} failed: ${details}`);
        error.isGraphQLError = true;
        throw error;
      }

      if (!data.data) {
        throw new Error(`Defined ${operation} returned no data`);
      }

      return data;
    } catch (error) {
      lastError = error;
      if (!isRetryable(error) || attempt === MAX_ATTEMPTS) {
        break;
      }

      await sleep(retryDelay(error, attempt));
    }
  }

  const status = lastError.response?.status;
  throw new Error(
    `Defined ${operation} request failed${status ? ` (${status})` : ""}: ${
      lastError.response?.data?.errors?.[0]?.message ?? lastError.message
    }`
  );
};

export const DefinedApiHandler = {
  async getPairsForToken({ query }) {
    return execute(query, "getPairsForToken");
  },

  async getTokenEvents({ query }) {
    return execute(query, "getTokenEvents");
  },

  async getTopTradeTokens({ query }) {
    return execute(query, "getTopTradeTokens");
  },

  async getFilterTokens({ query }) {
    return execute(query, "getFilterTokens");
  },

  async getTokenPrices({ query }) {
    return execute(query, "getTokenPrices");
  },

  async getTokenInfo({ query }) {
    return execute(query, "getTokenInfo");
  },

  async getPairForToken({ query }) {
    return execute(query, "getPairForToken");
  },
};
