import { Scenes } from "telegraf";
import { initCommand } from "../commands/initCommand.js";
import { filterTokensCommand } from "../commands/filterTokensCommand.js";
import { filterTokensKeyboard } from "../helpers/constants.js";

const filterTokensScene = new Scenes.BaseScene("filter_tokens");

filterTokensScene.enter(async (ctx) => {
  const messageText = "Вы точно хотите запустить добавление фильтр токенов?";

  try {
    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      messageText,
      filterTokensKeyboard
    );
  } catch (e) {
    console.log("Error while processing filterTokensScene.enter", e.message);
  }
});

filterTokensScene.action("yes", async (ctx) => {
  await filterTokensCommand(ctx);
});

filterTokensScene.action("back", async (ctx) => {
  await ctx.scene.leave();
  await initCommand(ctx);
});

export default filterTokensScene;
