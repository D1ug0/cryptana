import { mainDefined } from "../algorithms/definedTest/mainDefined.js";
import { getListTopTokens } from "../algorithms/definedTest/query/getListTopTokens.js";
import { backKeyboard, backStopKeyboard } from "../helpers/constants.js";
import { uploadPDF } from "../helpers/uploadPDF.js";
import { runScript } from "../helpers/utils.js";
import { selectProfitableWallets } from "../helpers/profitability.js";
import {
  createDefinedProgressReporter,
  runAlgorithmTask,
} from "../helpers/runAlgorithmTask.js";
import { Algorithm, Ticker, Whale } from "../models/models.js";
import { algorithmCommand } from "./algorithmCommand.js";

export async function listTopTokensCommand(ctx) {
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

      const topTokens = await getListTopTokens();
      let validatedTopTokens = [];

      for (const token of topTokens) {
        const [newTicker, created] = await Ticker.findOrCreate({
          where: {
            contract: token.address,
          },
          defaults: {
            contract: token.address,
            released: new Date(token.createdAt * 1000).getTime(),
            whales: 0,
          },
        });

        if (!created) {
          const lastUpdateTimestamp = newTicker.timestamp
            ? new Date(newTicker.timestamp).getTime()
            : null;
          const oneWeekAgoTimestamp =
            new Date().getTime() - 5 * 24 * 60 * 60 * 1000;

          if (
            newTicker.timestamp &&
            lastUpdateTimestamp >= oneWeekAgoTimestamp
          ) {
            continue;
          }
          await newTicker.update({
            whales: 0,
          });
          validatedTopTokens.push(token);
        } else {
          validatedTopTokens.push(token);
        }
      }

      let newData = {
        name: "тренд токены",
        tokens: validatedTopTokens.length,
        deleted: 0,
        checkedTokens: 0,
        goodX: 0,
        checkedGoodX: 0,
        contract: null,
        symbol: null,
        good: 0,
        newGood: 0,
        newGoodAddresses: "",
      };

      await algorithmCommand(ctx, { ...newData, status: true });

      void runAlgorithmTask(ctx, async () => {
        await algorithmCommand(ctx, null, [backStopKeyboard, backKeyboard]);

        for (const token of validatedTopTokens) {
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
          newData.contract = token.address;
          newData.name = "тренд токены — подготовка";
          await algorithmCommand(ctx, newData);

          const { processedItems, symbol } = await mainDefined({
            tokenAddress: token.address,
            onProgress: createDefinedProgressReporter(
              "тренд токены",
              token.address
            ),
          });

          const goodX = selectProfitableWallets(processedItems, 2);

          newData.contract = token.address;
          newData.name = "тренд токены";
          newData.symbol = symbol;
          newData.goodX = goodX.length;
          newData.checkedGoodX = 0;

          await algorithmCommand(ctx, newData);

          if (goodX.length > 500) {
            newData.checkedTokens += 1;
            await algorithmCommand(ctx, newData);
            continue;
          }

          for (const item of goodX) {
            const { status } = await Algorithm.findOne({ where: { id: 2 } });
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
            const obj = await runScript(ctx, item.maker, 30);
            if (obj?.address) {
              const timestamp = new Date().getTime();
              const [whale, whaleCreated] = await Whale.findOrCreate({
                where: { address: obj.address },
                defaults: {
                  address: obj.address,
                  winRate: obj.winRate,
                  timestamp: timestamp,
                },
              });
              await Ticker.increment("whales", {
                where: { contract: token.address },
              });
              if (!whaleCreated) {
                await whale.update({
                  winRate: obj.winRate,
                  timestamp: timestamp,
                });
              } else {
                newData.newGood += 1;
                newData.newGoodAddresses = `${newData.newGoodAddresses}${
                  newData.newGoodAddresses ? "\n" : ""
                }${obj.address}`;
                await uploadPDF(
                  ctx,
                  obj?.sum30,
                  obj?.tr30,
                  obj?.address,
                  obj?.period,
                  true
                );
              }
              newData.good += 1;
              await algorithmCommand(ctx, newData);
            }
            newData.checkedGoodX += 1;
            await algorithmCommand(ctx, newData);
          }
          await Ticker.update(
            {
              timestamp: new Date().getTime(),
            },
            { where: { contract: token.address } }
          );
          newData.checkedTokens += 1;
          await algorithmCommand(ctx, newData);
        }
        newData.status = false;
        await algorithmCommand(ctx, newData);
      });

      const message =
        "Алгоритм поиска и прогонки трендовых токенов был успешно запущен!";

      await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](message);
    }
  } catch (e) {
    console.log(
      "Error while processing listTopTokensCommand command",
      e.message
    );
  }
}
