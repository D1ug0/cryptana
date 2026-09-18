import fs from "fs";
import PDFDocument from "pdfkit-table";
import { backKeyboard, backStopKeyboard } from "../helpers/constants.js";
import { runScript } from "../helpers/utils.js";
import { runAlgorithmTask } from "../helpers/runAlgorithmTask.js";
import { Algorithm, Whale } from "../models/models.js";
import { algorithmCommand } from "./algorithmCommand.js";

export async function whalesCommand(ctx) {
  try {
    const { status } = await Algorithm.findOne({
      where: {
        id: 2,
      },
    });

    if (status) {
      const message =
        "В данный момент работает алгоритм проверок. Чтобы выполнить новую проверку нужно будет подождать пока алгоритм ниже закончит выполнение:";

      await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](message);

      await algorithmCommand(ctx, null, [backKeyboard, backKeyboard]);
    } else {
      const week = new Date();
      week.setDate(week.getDate() - 7);

      const whales = await Whale.findAll();
      let validatedWhales = [];

      for (const whale of whales) {
        const lastUpdateTimestamp = new Date(whale.timestamp).getTime();
        const oneWeekAgoTimestamp =
          new Date().getTime() - 1 * 24 * 60 * 60 * 1000;

        if (lastUpdateTimestamp >= oneWeekAgoTimestamp) {
          continue;
        }

        validatedWhales.push(whale);
      }

      let newData = {
        name: "актуализация китов",
        tokens: validatedWhales.length,
        deleted: 0,
        checkedTokens: 0,
        goodX: 0,
        checkedGoodX: 0,
        contract: null,
        symbol: null,
        good: 0,
        newGood: 0,
        newGoodAddresses: null,
      };

      await algorithmCommand(ctx, { ...newData, status: true });

      void runAlgorithmTask(ctx, async () => {
        await algorithmCommand(ctx, null, [backStopKeyboard, "no"]);

        for (const whale of validatedWhales) {
          const { status } = await Algorithm.findOne({
            where: { id: 2 },
          });
          if (!status) {
            await algorithmCommand(
              ctx,
              null,
              [backKeyboard, backKeyboard],
              true,
              ctx.session.algorithmStopMessage
            );
            return;
          }
          const obj = await runScript(ctx, whale.address, 30);
          if (obj?.address) {
            await whale.update({
              winRate: obj.winRate,
              timestamp: new Date().getTime(),
            });
            newData.good += 1;
            await algorithmCommand(ctx, newData);
          } else {
            await whale.destroy();
            await algorithmCommand(ctx, newData);
          }
          newData.checkedTokens += 1;
          await algorithmCommand(ctx, newData);
        }
        newData.status = false;
        await algorithmCommand(ctx, newData);

        const doc = new PDFDocument({ margin: 30, size: "A4" });
        const filePath = "whales_info.pdf";
        const stream = fs.createWriteStream(filePath);

        const docPromise = new Promise((resolve) => {
          stream.on("finish", resolve);
        });

        const actualWhales = await Whale.findAll();

        const tableData = {
          headers: ["Address", "WinRate"],
          rows: actualWhales.map((whale) => [
            whale.address,
            whale.winRate.toFixed(2),
          ]),
        };

        doc.table(tableData, {
          prepareHeader: () =>
            doc
              .font("Helvetica-Bold")
              .fontSize(10)
              .text("", { align: "center" }),
          prepareRow: () => {
            doc.font("Helvetica").fontSize(10).text("", { align: "center" });
          },
        });

        doc.pipe(stream);
        doc.end();

        await docPromise;

        const pdfBuffer = fs.readFileSync(filePath);

        await new Promise((resolve) => setTimeout(resolve, 2000));

        try {
          await ctx.replyWithDocument(
            {
              source: pdfBuffer,
              filename: "whales_info.pdf",
            },
            {
              caption: "Актуализированный список китов",
              ...backKeyboard,
            }
          );
        } finally {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });

      const message =
        "Алгоритм обновления информации о китах был успешно запущен!";

      await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](message);
    }
  } catch (e) {
    console.error("Ошибка при выполнении команды whales", e.message);
    ctx.reply("Извините, произошла ошибка при выполнении команды.");
  }
}
