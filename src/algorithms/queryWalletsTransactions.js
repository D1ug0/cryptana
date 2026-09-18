import { $apiZerion } from "../api/config.js";

const MAX_ATTEMPTS = 5;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getWithRetry = async (url) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      return await $apiZerion.get(url);
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      const retryable = !status || status === 429 || status >= 500;

      if (!retryable || attempt === MAX_ATTEMPTS) {
        throw error;
      }

      const retryAfter = Number(error.response?.headers?.["retry-after"]);
      const delay =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(1000 * 2 ** (attempt - 1), 10000);
      await wait(delay);
    }
  }

  throw lastError;
};

export const fetchWalletTransactions = async (address, period, onProgress) => {
  let apiUrl = `https://api.zerion.io/v1/wallets/${address}/transactions/?currency=usd&page[size]=100&filter[operation_types]=trade&filter[chain_ids]=ethereum&filter[asset_types]=fungible`;

  const minMinedAt = new Date().getTime() - period * 24 * 60 * 60 * 1000;
  const maxMinedAt = new Date().getTime();

  if (minMinedAt) {
    apiUrl += `&filter[min_mined_at]=${minMinedAt}`;
  }

  if (maxMinedAt) {
    apiUrl += `&filter[max_mined_at]=${maxMinedAt}`;
  }

  try {
    let allWalletTransactions = [];
    let count = 0;
    let transactionCount = 0;
    const seenUrls = new Set();

    while (apiUrl) {
      if (seenUrls.has(apiUrl)) {
        throw new Error("Zerion pagination returned the same page twice");
      }
      seenUrls.add(apiUrl);

      const response = await getWithRetry(apiUrl);

      const data = response.data;

      allWalletTransactions = allWalletTransactions.concat(data);
      transactionCount += data.data?.length ?? 0;

      apiUrl = data.links?.next ?? null;
      count += 1;
      await onProgress?.({
        pagesLoaded: count,
        transactionsLoaded: transactionCount,
        hasMore: Boolean(apiUrl),
      });
    }

    return allWalletTransactions;
  } catch (error) {
    const status = error.response?.status;
    throw new Error(
      `Zerion transactions request failed${status ? ` (${status})` : ""}: ${
        error.response?.data?.errors?.[0]?.detail ?? error.message
      }`
    );
  }
};
