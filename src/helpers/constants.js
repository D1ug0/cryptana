import { Markup } from "telegraf";

export const stableCoins = [
  "ETH",
  "WETH",
  "USDC",
  "USDT",
  "TUSD",
  "DAI",
  "HUSD",
  "PAXG",
  "BUSD",
  "HLUSD",
  "MIM",
  "USDN",
  "USDD",
  "GUSD",
];

export const summaryMappings = [
  { label: "Winrate R", path: "WinRateR", type: "%" },
  { label: "Winrate TOTAL", path: "WinRateTotal", type: "%" },
  { label: "PnL R", path: "PnLR", type: "$" },
  { label: "PnL TOTAL", path: "PnLTotal", type: "$" },
  { label: "Average R", path: "AverageR", type: "%" },
  { label: "Average TOTAL", path: "AverageTotal", type: "%" },
  // { label: "Total R", path: "TotalR", type: "%" },
  // { label: "Total SUM", path: "TotalSUM", type: "%" },
  { label: "Deposit R", path: "DepositR", type: "%" },
  { label: "Deposit TOTAL", path: "DepositTotal", type: "%" },
  { label: "Profit R", path: "ProfitR", type: "%" },
  { label: "Profit TOTAL", path: "ProfitTotal", type: "%" },
  { label: "Сделок", path: "Transactions" },
  { label: "Комиссий", path: "Fees", type: "$" },
];

export const fieldMappings = [
  { label: "Тикеры", path: "ticker" },
  { label: "Всего купили", path: "totalBuy.tokens" },
  { label: "Всего продали", path: "totalSell.tokens" },
  { label: "Комиссия, USD", path: "feeUSD" },
  { label: "Дельта", path: "delta.deltaTokens" },
  { label: "Накопление", path: "delta.accumPrice" },
  { label: "Сумма покупок, USD", path: "totalBuy.sumUSD" },
  { label: "Сумма продаж, USD", path: "totalSell.sumUSD" },
  { label: "Дельта, USD", path: "delta.deltaUSD" },
  { label: "Дельта, %", path: "delta.deltaPercentage" },
  { label: "Покупок", path: "totalBuy.orders" },
  { label: "Продаж", path: "totalSell.orders" },
  {
    label: "Последняя транзакция",
    path: "lastOrderTime",
    formatter: (time) => {
      const transactionTime = new Date(time);
      return transactionTime.toLocaleString();
    },
  },
  {
    label: "Период трейдов",
    path: "tradesPeriod",
  },
  { label: "Ликвидность, USD", path: "liquidity" },
  { label: "Объем торгов (24ч), USD", path: "volume" },
];

export const customButton = Markup.button.callback(
  "Ручная обработка токенов",
  "custom_tokens"
);
export const backCustomButton = Markup.button.callback(
  "Назад",
  "custom_tokens"
);
export const whales = Markup.button.callback("Киты", "whales");
export const tickers = Markup.button.callback("Тикеры", "tickers");
export const back = Markup.button.callback("Назад", "back");
export const listBaseTickers = Markup.button.callback(
  "Обработать все токены базы",
  "base_tokens"
);
export const listTopTickers = Markup.button.callback(
  "Обработать трендовые токены",
  "list_top_tokens"
);
export const filterToken = Markup.button.callback(
  "Актуализировать список токенов",
  "filter_tokens"
);
export const checkWallet = Markup.button.callback(
  "Проверить кошелёк",
  "check_wallet"
);
export const addTickers = Markup.button.callback("Добавить", "add");
export const addCheckTickers = Markup.button.callback(
  "Добавить и проверить",
  "add_check"
);
export const addCheckTickersOther = Markup.button.callback(
  "Хочу проверить другие",
  "custom_tokens"
);
export const removeTickers = Markup.button.callback("Удалить", "remove");

export const algorithmStatus = Markup.button.callback(
  "Статус алгоритма",
  "algorithm_status"
);

export const mainKeyboard = Markup.inlineKeyboard([
  [listBaseTickers],
  [listTopTickers],
  [filterToken],
  [customButton],
  [whales, tickers],
  [checkWallet, algorithmStatus],
]);

export const algorithmStop = Markup.button.callback(
  "Остановить алгоритм",
  "algorithm_stop"
);

export const backKeyboard = Markup.inlineKeyboard([back]);
export const backStopKeyboard = Markup.inlineKeyboard([
  [algorithmStop],
  [back],
]);
export const backCustomKeyboard = Markup.inlineKeyboard([backCustomButton]);
export const backStopCustomKeyboard = Markup.inlineKeyboard([
  [algorithmStop],
  [backCustomButton],
]);
export const customTokensKeyboard = Markup.inlineKeyboard([
  [addCheckTickers],
  [addTickers, removeTickers],
  [backCustomButton],
]);
export const customTokensKeyboardAfter = Markup.inlineKeyboard([
  [addCheckTickers],
  [backCustomButton],
]);

export const customTokensAlgoKeyboard = Markup.inlineKeyboard([
  [addTickers, backCustomButton],
]);
export const yesFilter = Markup.button.callback("Да", "yes");
export const noFilter = Markup.button.callback("Нет", "back");
export const filterTokensKeyboard = Markup.inlineKeyboard([
  [yesFilter, noFilter],
]);

export const yesTopTokens = Markup.button.callback("Да", "yes_filter");
export const noTopTokens = Markup.button.callback("Нет", "back");
export const listTopTokensKeyboard = Markup.inlineKeyboard([
  [yesTopTokens, noTopTokens],
]);

export const periodCheckKeyboard = (showAdditionalButtons) => {
  const buttons = [
    Markup.button.callback("30 дней", "period_30", false),
    Markup.button.callback("60 дней", "period_60", false),
    Markup.button.callback("90 дней", "period_90", false),
  ];

  const additionalButtons = [
    Markup.button.callback("Проверить другой кошелек", "check_wallet", false),
    Markup.button.callback("Выйти в главное меню", "back", false),
  ];

  const keyboard = [buttons];

  if (showAdditionalButtons) {
    keyboard.push(additionalButtons);
  }

  return Markup.inlineKeyboard(keyboard);
};
