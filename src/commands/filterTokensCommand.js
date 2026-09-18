import { getFilterTokens } from "../algorithms/definedTest/query/getFilterTokens.js";
import { backKeyboard } from "../helpers/constants.js";
import { Ticker } from "../models/models.js";

export async function filterTokensCommand(ctx) {
  let newTickersCount = 0;
  const newTickersInfo = [];
  const threeMonthsAgoTimestamp = Math.floor(
    (Date.now() - 3 * 30 * 24 * 60 * 60 * 1000) / 1000
  );

  const filterTickers = await getFilterTokens(threeMonthsAgoTimestamp);

  try {
    for (const { token } of filterTickers) {
      const [_, created] = await Ticker.findOrCreate({
        where: {
          contract: token.address,
        },
        defaults: {
          contract: token.address,
          released: new Date(token.createdAt * 1000).getTime(),
          whales: 0,
        },
      });

      if (created) {
        newTickersCount++;
        newTickersInfo.push({
          address: token.address,
          createdAt: token.createdAt,
          symbol: token.symbol,
          name: token.name,
        });
      }
    }
    await ctx.reply(
      `Количество новых тикеров, добавленных в базу данных: ${newTickersCount}`
    );

    if (newTickersInfo.length > 0) {
      const maxTokensPerMessage = 5;
      const separator =
        "--------------------------------------------------------";

      for (let i = 0; i < newTickersInfo.length; i += maxTokensPerMessage) {
        const tokensChunk = newTickersInfo.slice(i, i + maxTokensPerMessage);
        const formattedInfo = tokensChunk.map(
          (info) =>
            `\nToken Address: ${info.address}\nSymbol: ${
              info.symbol
            }\nName: ${info.name}\nCreatedAt: ${new Date(
              info.createdAt * 1000
            )
              .toISOString()
              .replace(/T/, " ")
              .replace(/\..+/, "")}\n`
        );
        await ctx.reply(
          `Информация о новых тикерах:${formattedInfo.join(separator)}`
        );
      }
    } else {
      await ctx.reply("Новые тикеры не были добавлены в базу данных.");
    }
    await ctx.reply("Перейти в главное меню?", backKeyboard);

    return;
  } catch (error) {
    console.error("Error processing tokens:", error);
    ctx.reply("Произошла ошибка при обработке тикеров.");
  }
}
