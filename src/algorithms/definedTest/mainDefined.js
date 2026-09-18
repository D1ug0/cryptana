import { getAllTransactionsToken } from "./help/getAllTransactionsToken.js";
import { processingParse } from "./help/processingParse.js";
import { getPairsForToken } from "./query/getFilterPairs.js";

export const mainDefined = async ({ tokenAddress, onProgress }) => {
  // Запрос за начальной датой токена и его пары
  const { pairs, symbol } = await getPairsForToken({
    tokenAddress,
  });

  // Создаем массив для хранения результатов всех транзакций
  const allTransactions = [];

  // Проходим по каждой паре
  for (const [pairIndex, pair] of pairs.entries()) {
    const { address, createdAt, targetTokenIndex, targetTokenDecimals } = pair;

    await onProgress?.({
      phase: "events",
      pairIndex: pairIndex + 1,
      pairTotal: pairs.length,
      pairAddress: address,
      page: 0,
      pairEventsLoaded: 0,
      totalEventsLoaded: allTransactions.length,
    });

    // Запрос за транзакциями в течение 90 дней
    const onePairResult = await getAllTransactionsToken({
      address,
      createdAt,
      targetTokenIndex,
      targetTokenDecimals,
      onProgress: (progress) =>
        onProgress?.({
          phase: "events",
          pairIndex: pairIndex + 1,
          pairTotal: pairs.length,
          pairAddress: address,
          page: progress.page,
          pairEventsLoaded: progress.eventsLoaded,
          totalEventsLoaded: allTransactions.length + progress.eventsLoaded,
          hasMore: progress.hasMore,
        }),
    });

    allTransactions.push(...onePairResult);
  }

  const result = allTransactions.sort((a, b) => a.timestamp - b.timestamp);

  // Парсинг транзакций
  const processedItems = processingParse(result);

  await onProgress?.({
    phase: "processing",
    pairTotal: pairs.length,
    totalEventsLoaded: allTransactions.length,
    processedWallets: processedItems.length,
  });

  return {
    processedItems,
    symbol,
  };
};
