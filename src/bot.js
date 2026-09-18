import { Scenes, Telegraf, TelegramError, session } from "telegraf";
import {
  algorithmCommand,
  algorithmStopCommand,
  clearAlgorithmInterval,
} from "./commands/algorithmCommand.js";
import { initCommand } from "./commands/initCommand.js";
import { tickersCommand } from "./commands/tickersCommand.js";
import { whalesCommand } from "./commands/whalesCommand.js";
import { appConfig, assertRuntimeConfig } from "./config.js";
import sequelize from "./db.js";
import { backKeyboard, backStopKeyboard } from "./helpers/constants.js";
import { Algorithm } from "./models/models.js";
import baseTokensScene from "./scenes/baseTokensScene.js";
import checkWalletScene from "./scenes/checkWalletScene.js";
import customTokensScene from "./scenes/customTokensScene.js";
import filterTokensScene from "./scenes/filterTokensScene.js";
import listTopTokensScene from "./scenes/listTopTokensScene.js";

export const bot = new Telegraf(appConfig.telegramToken || "not-configured", {
  handlerTimeout: Infinity,
});

bot.catch((error, ctx) => {
  if (error instanceof TelegramError && error.response) {
    console.error("Telegram request failed:", error.message);
  } else {
    console.error("Unhandled bot error:", error.message);
  }
});

const start = async () => {
  assertRuntimeConfig();
  await sequelize.authenticate();
  await sequelize.sync();
  await Algorithm.findOrCreate({
    where: { id: 2 },
    defaults: { id: 2, status: false, name: "ожидание" },
  });
  await Algorithm.update({ status: false }, { where: { id: 2 } });

  const stage = new Scenes.Stage([
    customTokensScene,
    filterTokensScene,
    listTopTokensScene,
    checkWalletScene,
    baseTokensScene,
  ]);

  bot.use(session());

  bot.use(async (ctx, next) => {
    const { id } = ctx.callbackQuery?.from || ctx.message?.from || ctx?.from;
    if (appConfig.allowedTelegramIds.includes(id)) {
      return next();
    } else {
      await ctx.reply("У вас нет доступа к этому боту.");
    }
  });

  bot.use((ctx, next) => {
    clearAlgorithmInterval(ctx);
    next();
  });

  bot.use(stage.middleware());

  // bot.telegram.setMyCommands([
  //   { command: "menu", description: "Главное меню" },
    // {
    //   command: "custom_tokens",
    //   description: "Кастомная обработка токенов",
    // },
    // { command: "whales", description: "Киты" },
    // { command: "tickers", description: "Тикеры" },
  // ]);

  bot.command(["menu", "start", "back"], (ctx) => {
    initCommand(ctx);
  });
  // bot.command("custom_tokens", (ctx) => {
  //   ctx.scene.enter("custom_tokens");
  // });

  // bot.command("whales", (ctx) => {
  //   whalesCommand(ctx);
  // });

  // bot.command("tickers", (ctx) => {
  //   tickersCommand(ctx);
  // });

  // bot.command("list_top_tokens", (ctx) => {
  //   ctx.scene.enter("list_top_tokens");
  // });

  // bot.command("filter_tokens", (ctx) => {
  //   ctx.scene.enter("filter_tokens");
  // });

  // bot.command("check_wallet", (ctx) => {
  //   ctx.scene.enter("check_wallet");
  // });

  bot.action("check_wallet", (ctx) => {
    ctx.scene.enter("check_wallet");
  });

  bot.action(["menu", "start", "back"], (ctx) => {
    initCommand(ctx);
  });

  bot.action("base_tokens", (ctx) => {
    ctx.scene.enter("base_tokens");
  });

  bot.action("filter_tokens", (ctx) => {
    ctx.scene.enter("filter_tokens");
  });

  bot.action("list_top_tokens", (ctx) => {
    ctx.scene.enter("list_top_tokens");
  });

  bot.action("custom_tokens", (ctx) => {
    ctx.scene.enter("custom_tokens");
  });

  bot.action("algorithm_status", (ctx) => {
    algorithmCommand(ctx, null, [backStopKeyboard, backKeyboard], true);
  });

  bot.action("whales", (ctx) => {
    whalesCommand(ctx);
  });

  bot.action("algorithm_stop", (ctx) => {
    algorithmStopCommand(ctx);
  });

  bot.action("tickers", (ctx) => {
    tickersCommand(ctx);
  });

  // bot.on(message("text"), (ctx) => {
  //   textCommand(ctx);
  // });

  bot.launch();

  // Команды для корректного завершения работы бота
  process.once("SIGINT", () => bot.stop("SIGINT"));
  process.once("SIGTERM", () => bot.stop("SIGTERM"));
};

start().catch((error) => {
  console.error("Error during startup:", error.message);
  process.exitCode = 1;
});
