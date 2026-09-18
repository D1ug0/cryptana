import { mainDefined } from "../../algorithms/definedTest/mainDefined.js";
import { backKeyboard, backStopKeyboard } from "../../helpers/constants.js";
import { runScript } from "../../helpers/utils.js";
import { selectProfitableWallets } from "../../helpers/profitability.js";
import {
  createDefinedProgressReporter,
  runAlgorithmTask,
} from "../../helpers/runAlgorithmTask.js";
import { Algorithm, Ticker, Whale } from "../../models/models.js";
import { algorithmCommand } from "../algorithmCommand.js";

export async function baseTokensCommand(ctx) {
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

      const baseTokens = await Ticker.findAll();
      let validatedBaseTokens = [];
      let deletedBaseTokens = [];

      for (const token of baseTokens) {
        const threeMonthsAgoTimestamp = Math.floor(
          Date.now() - 3 * 30 * 24 * 60 * 60 * 1000
        );
        const tokenReleaseDate = Math.floor(new Date(token.released).getTime());

        if (tokenReleaseDate >= threeMonthsAgoTimestamp) {
          const lastUpdateTimestamp = token.timestamp
            ? new Date(token.timestamp).getTime()
            : null;
          const oneWeekAgoTimestamp =
            new Date().getTime() - 7 * 24 * 60 * 60 * 1000;

          if (token.timestamp && lastUpdateTimestamp >= oneWeekAgoTimestamp) {
            continue;
          }

          await Ticker.update(
            {
              whales: 0,
            },
            { where: { contract: token.contract } }
          );

          validatedBaseTokens.push(token);
        } else {
          Ticker.destroy({
            where: {
              contract: token.contract,
            },
          });
          deletedBaseTokens.push(token);
        }
      }

      let newData = {
        name: "все токены базы",
        tokens: validatedBaseTokens.length,
        deleted: deletedBaseTokens.length,
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

        for (const token of validatedBaseTokens) {
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
          newData.contract = token.contract;
          newData.name = "все токены базы — подготовка";
          await algorithmCommand(ctx, newData);

          const { processedItems, symbol } = await mainDefined({
            tokenAddress: token.contract,
            onProgress: createDefinedProgressReporter(
              "все токены базы",
              token.contract
            ),
          });

          const goodX = selectProfitableWallets(processedItems, 2);

          newData.contract = token.contract;
          newData.name = "все токены базы";
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
                where: { contract: token.contract },
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
            { where: { contract: token.contract } }
          );
          newData.checkedTokens += 1;
          await algorithmCommand(ctx, newData);
        }
        newData.status = false;
        await algorithmCommand(ctx, newData);
      });

      const message =
        "Алгоритм полной проверки токенов бызы был успешно запущен!";

      await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](message);
    }
  } catch (e) {
    console.log("Error while processing baseTokensCommand command", e.message);
  }
}
