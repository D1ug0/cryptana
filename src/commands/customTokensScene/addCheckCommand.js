import { mainDefined } from "../../algorithms/definedTest/mainDefined.js";
import { getTokenInfo } from "../../algorithms/definedTest/query/getTokenInfo.js";
import {
  backCustomKeyboard,
  backKeyboard,
  backStopCustomKeyboard,
  customTokensAlgoKeyboard,
  customTokensKeyboardAfter,
} from "../../helpers/constants.js";
import { formatAddedTokens, runScript } from "../../helpers/utils.js";
import { selectProfitableWallets } from "../../helpers/profitability.js";
import {
  createDefinedProgressReporter,
  runAlgorithmTask,
} from "../../helpers/runAlgorithmTask.js";
import { Algorithm, Ticker, Whale } from "../../models/models.js";
import { algorithmCommand } from "../algorithmCommand.js";

export async function addCheckCommand(ctx) {
  const { status } = await Algorithm.findOne({
    where: {
      id: 2,
    },
  });

  if (status) {
    const message =
      "В данный момент работает алгоритм проверок. Вы можете добавить токены, но без проверки. Чтобы добавить с проверкой нужно будет подождать пока алгоритм ниже закончит выполнение:";

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](message);

    await algorithmCommand(ctx, null, [
      customTokensAlgoKeyboard,
      customTokensKeyboardAfter,
    ]);
  } else if (ctx.session) {
    const addresses = ctx.session?.customTokensScene?.arrayOfTokens;

    let alreadyAdded = [];
    let deleted = [];
    let responses = [];
    let notFound = [];

    const threeMonthsAgoTimestamp = Math.floor(
      Date.now() - 3 * 30 * 24 * 60 * 60 * 1000
    );

    for (const address of addresses) {
      let ticker = await Ticker.findOne({
        where: {
          contract: address,
        },
      });

      if (!ticker) {
        const released = await getTokenInfo(address);
        if (released !== 0 && released !== null) {
          ticker = await Ticker.create({
            whales: 0,
            contract: address,
            released: new Date(released * 1000).getTime(),
          });
          responses.push(ticker);
        } else {
          notFound.push(address);
        }
      } else {
        await Ticker.update(
          {
            whales: 0,
          },
          {
            where: {
              contract: address,
            },
          }
        );
        if (
          Math.floor(new Date(ticker.released).getTime()) >=
          threeMonthsAgoTimestamp
        ) {
          responses.push(ticker);
          alreadyAdded.push({ address, createdAt: ticker.createdAt });
        } else {
          await Ticker.destroy({
            where: {
              contract: address,
            },
          });
          deleted.push(ticker);
        }
      }
    }

    if (responses.length === 0) {
      await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](
        `Проверка не запущена: Defined не нашёл ${
          notFound.length === 1 ? "этот токен" : "эти токены"
        } в сети Ethereum:\n\n${notFound.join("\n")}`,
        backCustomKeyboard
      );
      return;
    }

    let newData = {
      name: "добавление и проверка",
      tokens: responses.length,
      deleted: deleted.length + notFound.length,
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
      await algorithmCommand(ctx, null, [
        backStopCustomKeyboard,
        backCustomKeyboard,
      ]);

      for (const resp of responses) {
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
        newData.contract = resp.contract;
        newData.name = "добавление и проверка — подготовка";
        await algorithmCommand(ctx, newData);

        const { processedItems, symbol } = await mainDefined({
          tokenAddress: resp.contract,
          onProgress: createDefinedProgressReporter(
            "добавление и проверка",
            resp.contract
          ),
        });

        const goodX = selectProfitableWallets(processedItems, 2);

        newData.contract = resp.contract;
        newData.name = "добавление и проверка";
        newData.symbol = symbol;
        newData.goodX = goodX.length;
        newData.checkedGoodX = 0;

        await algorithmCommand(ctx, newData);

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
              where: { id: resp.id },
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
          { where: { id: resp.id } }
        );
        newData.checkedTokens += 1;
        await algorithmCommand(ctx, newData);
      }
      newData.status = false;
      await algorithmCommand(ctx, newData);
    });

    const skippedMessage = notFound.length
      ? `\n\nНе найдены в Defined для Ethereum и пропущены:\n${notFound.join(
          "\n"
        )}`
      : "";
    const message = `${
      alreadyAdded.length === 0
        ? `Токены были успешно добавлены.`
        : alreadyAdded.length < responses.length
        ? `Часть токенов добавлена успешно, а часть уже присутствует в системе:\n\n${formatAddedTokens(
            alreadyAdded
          )}`
        : `Все добавляемые токены уже присутствуют в системе:\n\n${formatAddedTokens(
            alreadyAdded
          )}`
    }${skippedMessage}\n\nАлгоритм проверки найденных токенов успешно запущен!`;

    await ctx[ctx.callbackQuery ? "editMessageText" : "reply"](message);
  }
}
