import { getTokenEvents } from "../query/getTokenEvents.js";
import Big from "big.js";

export const normalizeTargetTokenEvent = (
  item,
  targetTokenIndex,
  targetTokenDecimals
) => {
  try {
    const rawAmount = new Big(item.data?.[`amount${targetTokenIndex}`] ?? 0);
    const divisor = new Big(10).pow(targetTokenDecimals);

    if (rawAmount.eq(0) || divisor.eq(0)) {
      return item;
    }

    return {
      ...item,
      eventDisplayType: rawAmount.lt(0) ? "Buy" : "Sell",
      data: {
        ...item.data,
        amountNonLiquidityToken: rawAmount.abs().div(divisor).toString(),
      },
    };
  } catch {
    return item;
  }
};

export const getAllTransactionsToken = async ({
  address,
  createdAt,
  targetTokenIndex,
  targetTokenDecimals,
  onProgress,
}) => {
  const threeMonthsAgoTimestamp = Math.floor(
    (Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) / 1000
  );
  const currentTimestamp = Math.floor(Date.now() / 1000);

  let cursor = "";
  let items = [];
  let page = 0;
  const seenCursors = new Set();

  while (cursor !== null) {
    if (seenCursors.has(cursor)) {
      throw new Error(`Defined pagination repeated cursor for pair ${address}`);
    }
    seenCursors.add(cursor);

    const { cursor: resultCursor, items: resultItems } = await getTokenEvents({
      pairAddress: address,
      startTimestamp: Math.max(threeMonthsAgoTimestamp, createdAt),
      endTimestamp: currentTimestamp,
      cursor,
    });

    items.push(
      ...(resultItems ?? []).map((item) =>
        normalizeTargetTokenEvent(
          item,
          targetTokenIndex,
          targetTokenDecimals
        )
      )
    );
    page += 1;
    await onProgress?.({
      page,
      eventsLoaded: items.length,
      hasMore: resultCursor !== null,
    });
    cursor = resultCursor;
  }

  return items;
};
