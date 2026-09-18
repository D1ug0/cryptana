import { Scenes } from "telegraf";
import { algorithmStopCommand } from "../commands/algorithmCommand.js";
import { baseTokensCommand } from "../commands/baseTokensScene/baseTokensCommand.js";
import { initCommand } from "../commands/initCommand.js";
import { filterTokensKeyboard } from "../helpers/constants.js";

const baseTokensScene = new Scenes.BaseScene("base_tokens");

baseTokensScene.enter(async (ctx) => {
  const messageText =
    "Вы точно хотите запустить алгоритм проверки всех токенов базы?";

  try {
    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      messageText,
      filterTokensKeyboard
    );
  } catch (e) {
    console.log("Error while processing baseTokensScene.enter", e.message);
  }
});

baseTokensScene.action("yes", async (ctx) => {
  await baseTokensCommand(ctx);
});

baseTokensScene.action("algorithm_stop", async (ctx) => {
  await algorithmStopCommand(ctx);
});

baseTokensScene.action("back", async (ctx) => {
  await ctx.scene.leave();
  await initCommand(ctx);
});

export default baseTokensScene;
