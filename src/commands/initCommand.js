import { mainKeyboard } from "../helpers/constants.js";

export async function initCommand(ctx) {
  try {
    const message =
      "Добро пожаловать в Cryptana! Выберите одну из услуг представленных ниже:";

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      message,
      mainKeyboard
    );
  } catch (e) {
    await ctx.reply(
      "Добро пожаловать в Cryptana! Выберите одну из услуг представленных ниже:",
      mainKeyboard
    );
  }
}
