import { bot } from "../bot.js";
import { backKeyboard } from "../helpers/constants.js";
import { Algorithm } from "../models/models.js";

export const algorithmStopCommand = async (ctx) => {
  ctx.session.algorithmStopMessage = ctx.callbackQuery.message;
  return await Algorithm.update({ status: false }, { where: { id: 2 } });
};

export const clearAlgorithmInterval = (ctx) => {
  if (ctx?.session?.algorithmInterval) {
    clearInterval(ctx.session.algorithmInterval);
    delete ctx.session.algorithmInterval;
  }
};

export async function algorithmCommand(
  ctx,
  newData,
  keyboards,
  fromMain,
  fromMessage
) {
  let data = newData || null;

  if (data) {
    await Algorithm.update(data, { where: { id: 2 } });
  } else if (!data) {
    let message = fromMessage;
    ctx.session.algorithmInterval = setInterval(async () => {
      data = await Algorithm.findOne({ where: { id: 2 } });

      message = await sendAlgorithmMessage(
        ctx,
        data,
        message,
        data.status ? keyboards[0] : keyboards[1],
        fromMain
      );

      if (!data.status) {
        clearInterval(ctx.session.algorithmInterval);
      }
    }, 2000);
  }
}

async function sendAlgorithmMessage(ctx, data, message, keyboard, fromMain) {
  const text =
    `Статус: ${data.status ? "В ПРОЦЕССЕ ⏳" : "ЗАВЕРШЕН ⛔️"}\n\n` +
    `Алгоритм: ${data.name}\n\n` +
    (data.name !== "актуализация китов"
      ? `Количество найденных токенов: ${data.tokens}\n` +
        `Количество удаленных токенов: ${data.deleted}\n` +
        `Проверено токенов: ${data.checkedTokens}/${data.tokens}\n` +
        `Новых китов: ${data.newGood}/${data.good}:\n` +
        // `${data.newGoodAddresses || "(пусто)"}\n\n` +
        `Текущий токен: ${data.contract || "(пусто)"}\n` +
        `Символ токена: ${data.symbol || "(пусто)"}\n` +
        `Проверено с 2x+ по токену: ${data.checkedGoodX}/${data.goodX}\n`
      : `Количество перепроверяемых китов: ${data.tokens}\n` +
        `Проверено китов: ${data.checkedTokens}/${data.tokens}\n` +
        `Оставлено китов: ${data.good}\n`);
  try {
    if (message) {
      return await bot.telegram.editMessageText(
        message.chat.id,
        message.message_id,
        undefined,
        text,
        keyboard && keyboard !== "no"
          ? keyboard
          : keyboard !== "no"
          ? backKeyboard
          : undefined
      );
    } else {
      if (fromMain) {
        return await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
          text,
          keyboard ? keyboard : backKeyboard
        );
      } else {
        return await ctx.reply(
          text,
          keyboard && keyboard !== "no"
            ? keyboard
            : keyboard !== "no"
            ? backKeyboard
            : undefined
        );
      }
    }
  } catch (e) {
    return message;
  }
}
