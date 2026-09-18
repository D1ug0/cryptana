import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import { addCheckCommand } from "../commands/customTokensScene/addCheckCommand.js";
import { addCommand } from "../commands/customTokensScene/addCommand.js";
import { enterCommand } from "../commands/customTokensScene/enterCommand.js";
import { removeCommand } from "../commands/customTokensScene/removeCommand.js";
import { textCommand } from "../commands/customTokensScene/textCommand.js";
import { initCommand } from "../commands/initCommand.js";
import { algorithmStopCommand } from "../commands/algorithmCommand.js";

const customTokensScene = new Scenes.BaseScene("custom_tokens");

customTokensScene.enter(async (ctx) => {
  await enterCommand(ctx);
});

customTokensScene.on(message("text"), async (ctx) => {
  await textCommand(ctx);
});

customTokensScene.action("add", async (ctx) => {
  await addCommand(ctx);
});

customTokensScene.action("add_check", async (ctx) => {
  await addCheckCommand(ctx);
});

customTokensScene.action("remove", async (ctx) => {
  await removeCommand(ctx);
});

customTokensScene.action("algorithm_stop", async (ctx) => {
  await algorithmStopCommand(ctx);
});

customTokensScene.action("back", async (ctx) => {
  await ctx.scene.leave();
  await initCommand(ctx);
});

export default customTokensScene;
