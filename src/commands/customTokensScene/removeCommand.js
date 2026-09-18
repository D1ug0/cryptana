import { backCustomKeyboard } from "../../helpers/constants.js";
import { formatAddedTokens } from "../../helpers/utils.js";
import { Ticker } from "../../models/models.js";

export async function removeCommand(ctx) {
  if (ctx.session) {
    const tokens = ctx.session?.customTokensScene?.arrayOfTokens;
    let alreadyDeleted = [];
    for (const address of tokens) {
      const deleted = await Ticker.destroy({
        where: {
          contract: address,
        },
      });

      if (deleted === 0) {
        alreadyDeleted.push({ address, createdAt: null });
      }
    }

    const message =
      alreadyDeleted.length === 0
        ? `Токены были успешно удалены.\n\nНажмите "Hазад" для продолжения работы с ботом`
        : alreadyDeleted.length < tokens.length
        ? `Часть токенов удалена успешно, а часть и не присутствовала в системе:\n\n${formatAddedTokens(
            alreadyDeleted,
            false
          )}`
        : `Все удаляемые токены не присутствовали в системе:\n\n${formatAddedTokens(
            alreadyDeleted,
            false
          )}`;

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      message,
      backCustomKeyboard
    );
  }
}
