import { bot } from "../bot.js";
import { appConfig } from "../config.js";
import { createWalletReportBuffer } from "./walletReportPdf.js";

export const uploadPDF = async (ctx, summary, transactions, address, period, isAllSend = false) => {
  if (summary && transactions) {
    const walletAddress = ctx.scene?.session?.address ?? address;
    const reportPeriod = ctx.scene?.session?.period ?? period;
    const filename = `${walletAddress}.pdf`;
    const buffer = await createWalletReportBuffer({
      summary,
      transactions,
      address: walletAddress,
      period: reportPeriod,
    });

    if (isAllSend) {
      for (const telegramId of appConfig.allowedTelegramIds) {
        await bot.telegram.sendDocument(
          telegramId,
          { source: buffer, filename },
          { caption: `Вы выгрузили отчёт за ${reportPeriod} дней` }
        );
      }
    } else {
      await ctx.replyWithDocument(
        { source: buffer, filename },
        { caption: `Вы выгрузили отчёт за ${reportPeriod} дней` }
      );
    }
  } else {
    await ctx.reply("За выбранный период торговые операции не найдены.");
  }
};
