import {
  backCustomKeyboard,
  customTokensKeyboard,
} from "../../helpers/constants.js";
import { splitAddresses } from "../../helpers/utils.js";

export async function textCommand(ctx) {
  const result = splitAddresses(ctx.message.text);

  if (result.every((addr) => /^(0x)?[0-9a-fA-F]{40}$/.test(addr))) {
    ctx.session = {
      ...(ctx.session ?? {}),
      customTokensScene: {
        arrayOfTokens: result,
      },
    };

    const messageText = "Какое действие вы хотите сделать с этими токенами?";
    const keyboard = customTokensKeyboard;

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      messageText,
      keyboard
    );
  } else {
    const errorMessage =
      "Добавление было отменено, один или несколько токенов были переданы неверно, попробуйте еще раз";
    const keyboard = backCustomKeyboard;

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      errorMessage,
      keyboard
    );
  }
}
