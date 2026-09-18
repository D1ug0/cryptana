import { backKeyboard } from "../../helpers/constants.js";

export async function enterCommand(ctx) {
  const messageText = "Введите один или несколько контрактных адресов токенов";
  const keyboard = ctx.callbackQuery ? backKeyboard : undefined;

  try {
    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      messageText,
      keyboard
    );
  } catch (e) {
    console.log("Error while processing enterCommand", e.message);
  }
}
