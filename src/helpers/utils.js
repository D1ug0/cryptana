import { transactionPairing } from "../main.js";
import { isWithinLast14Days } from "./time.js";

export { isWithinLast14Days } from "./time.js";

export const toFixedNumber = (number, float) =>
  Math.round(number * (float ? Math.pow(10, float) : 1e2)) /
  (float ? Math.pow(10, float) : 1e2);

export const compareSort = (order1, order2) => {
  const {
    delta: { deltaUSD: deltaUSD1, deltaTokens: deltaTokens1 },
  } = order1;
  const {
    delta: { deltaUSD: deltaUSD2, deltaTokens: deltaTokens2 },
  } = order2;

  if (deltaTokens1 > 0 && deltaTokens2 > 0) {
    return deltaUSD2 - deltaUSD1;
  }

  if (deltaTokens1 > 0) {
    return 1;
  }

  if (deltaTokens2 > 0) {
    return -1;
  }

  return deltaUSD2 - deltaUSD1;
};

export const formatCreatedAt = (timestamp) => {
  const date = new Date(timestamp * 1000);
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

export const splitAddresses = (text) => {
  const delimiterPattern = /[\n,;\s]+/;
  const resultArray = text.split(delimiterPattern);
  return resultArray.filter((item) => item.trim() !== "");
};

export function formatDate(inputDate) {
  const originalDate = new Date(inputDate);

  const formattedDate = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/Moscow",
  }).format(originalDate);

  const finalFormattedDate = formattedDate.replace(/\//g, ".");

  return finalFormattedDate;
}

export const runScript = async (ctx, address, period) => {
  const { summary: sum30, transactions: tr30 } = await transactionPairing(
    ctx,
    address,
    period,
    false
  );

  let winRate = null;

  if (whaleValidation(sum30, tr30)) {
    winRate = sum30["WinRateTotal"];

    // const { summary, transactions } = await transactionPairing(
    //   ctx,
    //   address,
    //   90,
    //   false
    // );
    // if (whaleValidation(summary, transactions)) {

    return { address, winRate, sum30, tr30, period };
    // } else {
    //   return null;
    // }
  } else {
    return null;
  }
};

export const formatAddedTokens = (tokens, withBackText) => {
  return `${tokens
    .map(
      (token) =>
        `${token.address.slice(0, 5)}...${token.address.slice(-5)}${
          token.createdAt ? ` от ${formatDate(token.createdAt)}` : ""
        }`
    )
    .join("\n")}${
    withBackText ? `\n\nНажмите "Назад" для продолжения работы с ботом` : ""
  }`;
};

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function calculateTimeDifference(firstTime, lastTime) {
  const startTime = new Date(firstTime);
  const endTime = new Date(lastTime);

  const minutes = Math.floor((endTime - startTime) / (1000 * 60));

  return {
    forDisplay:
      minutes >= 60
        ? `${Math.floor(minutes / 60)} h ${minutes % 60} min`
        : `${minutes} min`,
    forCalc: minutes,
  };
}

export const whaleValidation = (summary, transactions) => {
  return (
    summary &&
    transactions &&
    summary["WinRateTotal"] >= 80 &&
    summary.ProfitTotal > 30 &&
    (transactions.filter((obj) => obj.delta.deltaPercentage < -99).length /
      transactions.length) *
      100 <
      26 &&
    ((transactions.length >= 4 && summary.AverageTotal > 150) ||
      (transactions.length >= 6 && summary.AverageTotal > 25)) &&
    summary.AverageBuy < 5000 &&
    summary.AverageMinutes > 720 &&
    transactions.some((tr) => isWithinLast14Days(tr.lastOrderTime))
  );
};
