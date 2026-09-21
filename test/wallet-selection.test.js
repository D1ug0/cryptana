import assert from "node:assert/strict";
import test from "node:test";
import Big from "big.js";
import { processingParse } from "../src/algorithms/definedTest/help/processingParse.js";
import { normalizeTargetTokenEvent } from "../src/algorithms/definedTest/help/getAllTransactionsToken.js";
import { remapAlgorithm } from "../src/algorithms/remapAlgorithm.js";
import { hasMinimumReturnMultiple } from "../src/helpers/profitability.js";
import {
  isTimestampDifferenceWithinDays,
  isWithinLast14Days,
} from "../src/helpers/time.js";
import { isTokenNotFoundError } from "../src/algorithms/definedTest/query/getTokenInfo.js";
import { fetchWalletTransactions } from "../src/algorithms/queryWalletsTransactions.js";
import { $apiZerion } from "../src/api/config.js";
import { createWalletReportBuffer } from "../src/helpers/walletReportPdf.js";

const event = (maker, type, usd, quantity, timestamp) => ({
  maker,
  eventDisplayType: type,
  timestamp,
  data: {
    priceUsdTotal: String(usd),
    amountNonLiquidityToken: String(quantity),
  },
});

test("counts a sale only against tokens bought inside the scan window", () => {
  const result = processingParse([
    event("wallet", "Sell", 1000, 1000, 1),
    event("wallet", "Buy", 10, 1, 2),
    event("wallet", "Sell", 1000, 1000, 3),
  ]);

  assert.deepEqual(result, []);
});

test("derives direction and quantity from the actual target token side", () => {
  const normalized = normalizeTargetTokenEvent(
    {
      eventDisplayType: "Sell",
      data: { amount0: "2500000", amount1: "-3000000000000000000" },
    },
    1,
    18
  );

  assert.equal(normalized.eventDisplayType, "Buy");
  assert.equal(normalized.data.amountNonLiquidityToken, "3");
});

test("prorates a sale when it is larger than the tracked balance", () => {
  const [wallet] = processingParse([
    event("wallet", "Buy", 10, 10, 1),
    event("wallet", "Sell", 30, 20, 2),
  ]);

  assert.equal(wallet.totalBuy.toString(), "10");
  assert.equal(wallet.totalSell.toString(), "15");
  assert.equal(wallet.sellCount, 1);
});

test("2x means sale proceeds are at least twice the purchase amount", () => {
  assert.equal(
    hasMinimumReturnMultiple({ totalBuy: new Big(100), totalSell: new Big(200) }),
    true
  );
  assert.equal(
    hasMinimumReturnMultiple({ totalBuy: new Big(100), totalSell: new Big(199.99) }),
    false
  );
});

test("timestamp comparison uses seconds and rejects either direction past the limit", () => {
  assert.equal(isTimestampDifferenceWithinDays(14 * 86400, 14), true);
  assert.equal(isTimestampDifferenceWithinDays(-14 * 86400, 14), true);
  assert.equal(isTimestampDifferenceWithinDays(14 * 86400 + 1, 14), false);
});

test("recent-date validation rejects future and invalid dates", () => {
  const now = Date.UTC(2026, 8, 21, 12);

  assert.equal(isWithinLast14Days(now - 14 * 86400 * 1000, now), true);
  assert.equal(isWithinLast14Days(now - 14 * 86400 * 1000 - 1, now), false);
  assert.equal(isWithinLast14Days(now + 1, now), false);
  assert.equal(isWithinLast14Days("not-a-date", now), false);
});

test("additional fees are deducted even when no liquidity response exists", () => {
  const [result] = remapAlgorithm(
    [{ tokenContract: "token", fee: 5 }],
    [],
    [
      {
        tokenContract: "token",
        feeUSD: 1,
        totalBuy: { sumUSD: 100 },
        totalSell: { sumUSD: 150 },
        delta: { deltaUSD: 49, deltaPercentage: 49 },
      },
    ]
  );

  assert.equal(result.feeUSD, 6);
  assert.equal(result.delta.deltaUSD, 44);
  assert.equal(result.delta.deltaPercentage, 44);
});

test("recognizes Defined's normal token-not-found response", () => {
  assert.equal(
    isTokenNotFoundError(
      new Error(
        "Defined getTokenInfo request failed: Defined getTokenInfo failed: Token not found"
      )
    ),
    true
  );
  assert.equal(isTokenNotFoundError(new Error("request timed out")), false);
});

test("Zerion pagination continues beyond 100 pages", async () => {
  const originalAdapter = $apiZerion.defaults.adapter;
  let requestedPages = 0;
  let finalProgress;

  $apiZerion.defaults.adapter = async () => {
    requestedPages += 1;
    return {
      data: {
        data: [{ id: requestedPages }],
        links: {
          next:
            requestedPages < 101
              ? `https://example.test/page/${requestedPages + 1}`
              : null,
        },
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    };
  };

  try {
    const pages = await fetchWalletTransactions("0xwallet", 30, (progress) => {
      finalProgress = progress;
    });

    assert.equal(pages.length, 101);
    assert.equal(finalProgress.pagesLoaded, 101);
    assert.equal(finalProgress.transactionsLoaded, 101);
  } finally {
    $apiZerion.defaults.adapter = originalAdapter;
  }
});

test("wallet report generator returns a valid PDF buffer", async () => {
  const buffer = await createWalletReportBuffer({
    address: "0x0000000000000000000000000000000000000001",
    period: 30,
    summary: {
      WinRateR: 50,
      WinRateTotal: 50,
      PnLR: 1,
      PnLTotal: 1,
      AverageR: 1,
      AverageTotal: 1,
      DepositR: 1,
      DepositTotal: 1,
      ProfitR: 1,
      ProfitTotal: 1,
      Transactions: 1,
      Fees: 1,
    },
    transactions: [],
  });

  assert.equal(buffer.subarray(0, 4).toString(), "%PDF");
  assert.ok(buffer.length > 1000);
});
