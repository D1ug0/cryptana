import { backKeyboard } from "../helpers/constants.js";
import { Ticker } from "../models/models.js";

export async function tickersCommand(ctx) {
  try {
    const tickers = await Ticker.findAll();

    const tickersInfoStrings = tickers
      .map((ticker) => {
        return `Contract: ${ticker.contract}, Whales: ${ticker.whales}\n`;
      })
      .join("\n");

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      tickersInfoStrings,
      backKeyboard
    );
  } catch (e) {
    console.log("Error while processing tickersCommand command", e.message);
  }
}
