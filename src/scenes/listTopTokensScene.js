import { Scenes } from "telegraf";
import { algorithmStopCommand } from "../commands/algorithmCommand.js";
import { initCommand } from "../commands/initCommand.js";
import { listTopTokensCommand } from "../commands/listTopTokensCommand.js";
import { listTopTokensKeyboard } from "../helpers/constants.js";

const listTopTokensScene = new Scenes.BaseScene("list_top_tokens");

listTopTokensScene.enter(async (ctx) => {
  const messageText =
    "Вы точно хотите запустить нахождение и прогонку трендовых токенов?";

  try {
    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      messageText,
      listTopTokensKeyboard
    );
  } catch (e) {
    console.log("Error while processing listTopTokensScene.enter", e.message);
  }
});

listTopTokensScene.action("yes_filter", async (ctx) => {
  await listTopTokensCommand(ctx);
});

listTopTokensScene.action("algorithm_stop", async (ctx) => {
  await algorithmStopCommand(ctx);
});

listTopTokensScene.action("back", async (ctx) => {
  await ctx.scene.leave();
  await initCommand(ctx);
});

export default listTopTokensScene;
