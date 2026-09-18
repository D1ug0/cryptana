import { Scenes } from "telegraf";
import { message } from "telegraf/filters";
import { checkWalletCommand } from "../commands/checkWalletCommand.js";
import { initCommand } from "../commands/initCommand.js";
import { backKeyboard, periodCheckKeyboard } from "../helpers/constants.js";

const checkWalletScene = new Scenes.BaseScene("check_wallet");

checkWalletScene.enter(async (ctx) => {
  const messageText = "Введите адрес кошелька:";
  const keyboard = ctx.callbackQuery ? backKeyboard : undefined;

  try {
    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      messageText,
      keyboard
    );
  } catch (e) {
    console.log("Error while processing checkWalletScene.enter", e.message);
  }
});

checkWalletScene.on(message("text"), async (ctx) => {
  const address = ctx.message.text;
  const isAddressValid = /^(0x)?[0-9a-fA-F]{40}$/.test(address);

  if (isAddressValid) {
    ctx.scene.session.address = address;
    const messageText = `Выберите за какой промежуток дней хотите выгрузить отчёт для ${address}:`;
    const keyboard = periodCheckKeyboard(false);

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      messageText,
      keyboard
    );
  } else {
    const errorMessage =
      "Выгрузка отчёта не началась, адрес кошелька был передан неверно, попробуйте еще раз";
    const keyboard = backKeyboard;

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
      errorMessage,
      keyboard
    );
  }
});

checkWalletScene.action("period_90", async (ctx) => {
  ctx.scene.session.period = 90;
  await repeatActions(ctx);
});

checkWalletScene.action("period_60", async (ctx) => {
  ctx.scene.session.period = 60;
  await repeatActions(ctx);
});

checkWalletScene.action("period_30", async (ctx) => {
  ctx.scene.session.period = 30;
  await repeatActions(ctx);
});

checkWalletScene.action("back", async (ctx) => {
  await ctx.scene.leave();
  await initCommand(ctx);
});

const repeatActions = async (ctx) => {
  const loadingMessage = await ctx.reply("Загрузка транзакций: страница 0...");
  let lastStatusUpdate = 0;

  try {
    await checkWalletCommand(ctx, async (progress) => {
      const now = Date.now();
      if (progress.hasMore && now - lastStatusUpdate < 2000) {
        return;
      }
      lastStatusUpdate = now;

      await ctx.telegram
        .editMessageText(
          loadingMessage.chat.id,
          loadingMessage.message_id,
          undefined,
          `Загрузка транзакций: страниц ${progress.pagesLoaded}, операций ${progress.transactionsLoaded}${
            progress.hasMore ? "..." : ". Обработка отчёта..."
          }`
        )
        .catch(() => {});
    });

    if (ctx.callbackQuery) {
      await ctx.deleteMessage(loadingMessage.message_id).catch(() => {});
      await ctx.deleteMessage().catch(() => {});
    }

    await ctx.reply(
      `Хотите выгрузить еще раз отчет для ${ctx.scene.session.address}`,
      periodCheckKeyboard(true)
    );
  } catch (error) {
    console.error("Wallet report failed:", error.message);
    await ctx.telegram
      .editMessageText(
        loadingMessage.chat.id,
        loadingMessage.message_id,
        undefined,
        `Не удалось построить отчёт: ${error.message}`
      )
      .catch(() => {});
  }
};

export default checkWalletScene;
