import { getTokenInfo } from "../../algorithms/definedTest/query/getTokenInfo.js";
import { backCustomKeyboard } from "../../helpers/constants.js";
import { formatAddedTokens } from "../../helpers/utils.js";
import { Ticker } from "../../models/models.js";

export async function addCommand(ctx) {
  if (ctx.session) {
    const tokens = ctx.session?.customTokensScene?.arrayOfTokens;
    let added = [];
    let alreadyAdded = [];
    let notFound = [];
    for (const address of tokens) {
      const ticker = await Ticker.findOne({
        where: {
          contract: address,
        },
      });

      const threeMonthsAgoTimestamp = Math.floor(
        Date.now() - 3 * 30 * 24 * 60 * 60 * 1000
      );

      if (!ticker) {
        const released = await getTokenInfo(address);

        if (released !== 0 && released !== null) {
          const createdTicker = await Ticker.create({
            contract: address,
            whales: 0,
            released: new Date(released * 1000).getTime(),
          });
          added.push({ address, createdAt: createdTicker.createdAt });
        } else {
          notFound.push(address);
        }
      } else {
        alreadyAdded.push({ address, createdAt: ticker.createdAt });
        if (
          Math.floor(new Date(ticker.released).getTime()) <
          threeMonthsAgoTimestamp
        ) {
          await Ticker.destroy({
            where: {
              contract: address,
            },
          });
        }
      }
    }

    if (added.length === 0 && alreadyAdded.length === 0) {
      await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
        `Токены не добавлены: Defined не нашёл ${
          notFound.length === 1 ? "этот адрес" : "эти адреса"
        } в сети Ethereum:\n\n${notFound.join("\n")}`,
        backCustomKeyboard
      );
      return;
    }

    const resultMessage =
      alreadyAdded.length === 0
        ? `Токены были успешно добавлены.\n\nНажмите "Hазад" для продолжения работы с ботом`
        : alreadyAdded.length < added.length
        ? `Часть токенов добавлена успешно, а часть уже присутствует в системе:\n\n${formatAddedTokens(
            alreadyAdded
          )}`
        : `Все добавляемые токены уже присутствуют в системе:\n\n${formatAddedTokens(
            alreadyAdded
          )}`;
    const message = `${resultMessage}${
      notFound.length
        ? `\n\nНе найдены в Defined для Ethereum и пропущены:\n${notFound.join(
            "\n"
          )}`
        : ""
    }`;

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      message,
      backCustomKeyboard
    );
  }
}
