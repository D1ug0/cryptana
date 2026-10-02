import assert from "node:assert/strict";
import test from "node:test";
import { arrangeTransactionsByToken } from "../src/algorithms/prepTransactions.js";

const transfer = ({ symbol, chainId, address, direction = "in", value = 1 }) => ({
  direction,
  value,
  fungible_info: {
    symbol,
    implementations: [{ chain_id: chainId, address }],
  },
});

const page = (...transfers) => ({
  data: [
    {
      attributes: {
        hash: "0xtransaction",
        transfers,
      },
    },
  ],
});

test("ignores tokens that do not have an Ethereum contract", () => {
  const groups = arrangeTransactionsByToken([
    page(
      transfer({
        symbol: "SOLTOKEN",
        chainId: "solana",
        address: "solana-address",
      })
    ),
  ]);

  assert.deepEqual(groups, []);
});

test("groups tokens by their Ethereum contract", () => {
  const groups = arrangeTransactionsByToken([
    page(
      transfer({
        symbol: "TOKEN",
        chainId: "ethereum",
        address: "0xtoken",
      })
    ),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].tokenContract, "0xtoken");
  assert.equal(groups[0].transactions.length, 1);
});

test("does not mistake another contract with the same symbol for a purchase", () => {
  const groups = arrangeTransactionsByToken([
    page(
      transfer({
        symbol: "TOKEN",
        chainId: "ethereum",
        address: "0xsold",
        direction: "out",
      }),
      transfer({
        symbol: "TOKEN",
        chainId: "ethereum",
        address: "0xbought",
      })
    ),
  ]);

  assert.deepEqual(groups.map((group) => group.tokenContract), ["0xbought"]);
});

test("groups the same Ethereum contract regardless of address casing", () => {
  const groups = arrangeTransactionsByToken([
    page(
      transfer({
        symbol: "TOKEN",
        chainId: "ethereum",
        address: "0xAbC",
      }),
      transfer({
        symbol: "TOKEN",
        chainId: "ethereum",
        address: "0xaBc",
      })
    ),
  ]);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].transactions.length, 1);
});
