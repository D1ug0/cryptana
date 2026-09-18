import { accumLiquidVolume } from "./algorithms/accumLiquidVolume.js";
import { feesProcess } from "./algorithms/feesProcess.js";
import { clearNoValueObjects } from "./algorithms/noValueAddObject.js";
import { prepareTokenInfo } from "./algorithms/prepTokens.js";
import { arrangeTransactionsByToken } from "./algorithms/prepTransactions.js";
import { fetchWalletTransactions } from "./algorithms/queryWalletsTransactions.js";
import { remapAlgorithm } from "./algorithms/remapAlgorithm.js";
import { calculateSummary } from "./algorithms/summaryAlgorithm.js";
import { compareSort } from "./helpers/utils.js";

export const transactionPairing = async (
  ctx,
  address,
  minMinedAt,
  isNoAlgoState = true,
  onProgress
) => {
  clearNoValueObjects(ctx, isNoAlgoState);

  // Получение всех транзакций
  const walletTransactions = await fetchWalletTransactions(
    address,
    minMinedAt,
    onProgress
  );

  // console.log("walletTransactions ДО", walletTransactions);

  if (
    !walletTransactions ||
    walletTransactions[0]?.errors ||
    walletTransactions.length === 0
  ) {
    return { summary: null, transactions: null };
  }

  // console.log("walletTransactions ПОСЛЕ", walletTransactions);

  // Распределение транзакций по тикерам и получение нужных
  const resultArray = arrangeTransactionsByToken(walletTransactions);

  // Суммарная информация по каждому тикеру
  const finalResult = await Promise.all(
    resultArray.map((data) => prepareTokenInfo(ctx, isNoAlgoState, data))
  );

  // Алгоритм получения комиссий
  const feesValues = await feesProcess(ctx, isNoAlgoState);

  // Алгоритм получения объема, ликвидности и накоплений
  const accumLiquidVolumeValues = await accumLiquidVolume(
    ctx,
    isNoAlgoState,
    finalResult
  );

  // Алгоритм изменения данных таблицы с учетом комиссий, объема, ликвидности, накоплений
  const remappedValues = await remapAlgorithm(
    feesValues,
    accumLiquidVolumeValues,
    finalResult
  );

  return {
    summary: calculateSummary(remappedValues),
    transactions: remappedValues.sort(compareSort),
  };
};
