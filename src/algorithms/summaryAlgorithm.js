export const calculateSummary = (transactions) => {
  const filteredTransactions = transactions.filter(
    (t) => t.delta.deltaTokens === 0
  );

  const calculatePercentage = (transactions, condition) =>
    (transactions.filter(condition).length / transactions.length) * 100 || 0;

  const calculateSum = (transactions, condition, field) =>
    transactions.reduce(
      (sum, t) => (condition(t) ? sum + t.delta[field] : sum),
      0
    );

  const calculateAverage = (transactions, condition, field) =>
    transactions.reduce((sum, t) => sum + t.delta[field], 0) /
      transactions.filter(condition).length || 0;

  const calculateDepositPercentage = (transactions) => {
    const totalUSD = transactions.reduce(
      (sum, t) => sum + t.delta.deltaUSD + t.feeUSD,
      0
    );
    const totalInvestedUSD = transactions.reduce(
      (sum, t) => sum + t.totalBuy.sumUSD,
      0
    );
    return (totalUSD / totalInvestedUSD) * 100 || 0;
  };

  const calculateProfitPercentage = (transactions) => {
    const totalUSD = transactions.reduce((sum, t) => sum + t.delta.deltaUSD, 0);
    const totalInvestedUSD = transactions.reduce(
      (sum, t) => sum + t.totalBuy.sumUSD,
      0
    );
    return (totalUSD / totalInvestedUSD) * 100 || 0;
  };

  const calculateAverageBuy = (transactions) => {
    const totalInvestedUSD = transactions.reduce(
      (sum, t) => sum + t.totalBuy.sumUSD,
      0
    );
    return totalInvestedUSD / transactions.length || null;
  };

  const calculateAverageTimes = (transactions) => {
    const totalTradeMinutes = transactions.reduce(
      (sum, t) => sum + t.allTradeTime,
      0
    );
    return totalTradeMinutes / transactions.length || null;
  };

  return {
    WinRateR: calculatePercentage(
      filteredTransactions,
      (t) => t.delta.deltaPercentage > 0
    ),
    WinRateTotal: calculatePercentage(
      transactions,
      (t) => t.delta.deltaPercentage > 0
    ),
    PnLR: calculateSum(
      filteredTransactions,
      (t) => t.delta.deltaTokens === 0,
      "deltaUSD"
    ),
    PnLTotal: calculateSum(transactions, () => true, "deltaUSD"),
    AverageR: calculateAverage(
      filteredTransactions,
      (t) => t.delta.deltaTokens === 0,
      "deltaPercentage"
    ),
    AverageTotal: calculateAverage(transactions, () => true, "deltaPercentage"),
    // TotalR: calculateSum(
    //   filteredTransactions,
    //   (t) => t.delta.deltaTokens === 0,
    //   "deltaPercentage"
    // ),
    // TotalSUM: calculateSum(transactions, () => true, "deltaPercentage"),
    DepositR: calculateDepositPercentage(filteredTransactions),
    DepositTotal: calculateDepositPercentage(transactions),
    ProfitR: calculateProfitPercentage(filteredTransactions),
    ProfitTotal: calculateProfitPercentage(transactions),
    Transactions: transactions.reduce(
      (sum, t) => sum + t.totalBuy.orders + t.totalSell.orders,
      0
    ),
    Fees: transactions.reduce((sum, t) => sum + t.feeUSD, 0),
    AverageBuy: calculateAverageBuy(transactions),
    AverageMinutes: calculateAverageTimes(transactions),
  };
};
