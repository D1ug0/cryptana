import { stableCoins } from "../helpers/constants.js";

export const arrangeTransactionsByToken = (allWalletTransactions) => {
  const result = [];

  allWalletTransactions.forEach((data) => {
    data.data.forEach((transaction) => {
      const transfers = transaction.attributes.transfers;

      transfers.forEach((transfer) => {
        const tokenSymbol = transfer.fungible_info.symbol;

        if (tokenSymbol && !stableCoins.includes(tokenSymbol)) {
          const transactionHash = transaction.attributes.hash;
          const tokenContract = transfer.fungible_info.implementations.find(
            (i) => i.chain_id === "ethereum"
          )?.address;

          let tokenGroup = result.find(
            (group) => group.tokenContract === tokenContract
          );

          if (!tokenGroup) {
            tokenGroup = {
              tokenSymbol,
              tokenContract,
              transactions: [],
            };
            result.push(tokenGroup);
          }

          if (
            !tokenGroup.transactions.some(
              (t) => t.attributes.hash === transactionHash
            )
          ) {
            tokenGroup.transactions.push(transaction);
          }
        }
      });
    });
  });

  const filteredResult = result.filter((transaction) =>
    transaction.transactions.find(
      (tr) =>
        tr.attributes.transfers.find(
          (t) =>
            !stableCoins.includes(t.fungible_info.symbol) &&
            t.direction === "in" &&
            transaction.tokenSymbol === t.fungible_info.symbol // хоть одна транзакция с покупкой по токену
        ) && tr.attributes.transfers.find((t) => t.value) // либо во входящих либо в уходящих есть значение в $
    )
  );

  return filteredResult;
};
