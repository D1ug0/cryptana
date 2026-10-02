import { stableCoins } from "../helpers/constants.js";

const getEthereumContract = (transfer) =>
  transfer.fungible_info.implementations?.find(
    (implementation) => implementation.chain_id === "ethereum"
  )?.address;

export const arrangeTransactionsByToken = (allWalletTransactions) => {
  const result = [];

  allWalletTransactions.forEach((data) => {
    data.data.forEach((transaction) => {
      const transfers = transaction.attributes.transfers;

      transfers.forEach((transfer) => {
        const tokenSymbol = transfer.fungible_info.symbol;

        if (tokenSymbol && !stableCoins.includes(tokenSymbol)) {
          const transactionHash = transaction.attributes.hash;
          const tokenContract = getEthereumContract(transfer);

          if (!tokenContract) {
            return;
          }

          let tokenGroup = result.find(
            (group) =>
              group.tokenContract.toLowerCase() === tokenContract.toLowerCase()
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
            getEthereumContract(t)?.toLowerCase() ===
              transaction.tokenContract.toLowerCase() // хоть одна транзакция с покупкой по токену
        ) && tr.attributes.transfers.find((t) => t.value) // либо во входящих либо в уходящих есть значение в $
    )
  );

  return filteredResult;
};
