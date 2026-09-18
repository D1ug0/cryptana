import { backKeyboard } from "./constants.js";
import { Algorithm } from "../models/models.js";

export const runAlgorithmTask = (ctx, task) => {
  return (async () => {
    try {
      await task();
    } catch (error) {
      console.error("Algorithm task failed:", error.message);
      const message =
        error.message === "Проверка остановлена пользователем"
          ? error.message
          : `Проверка остановлена из-за ошибки: ${error.message}`;
      await ctx
        .reply(message, backKeyboard)
        .catch(() => {});
    } finally {
      await Algorithm.update({ status: false }, { where: { id: 2 } }).catch(
        (error) => console.error("Failed to reset algorithm status:", error.message)
      );
    }
  })();
};

export const createDefinedProgressReporter = (label, tokenAddress) => {
  const startedAt = Date.now();

  return async (progress) => {
    const elapsedSeconds = Math.max(1, Math.floor((Date.now() - startedAt) / 1000));
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = String(elapsedSeconds % 60).padStart(2, "0");
    const eventsPerSecond = Math.round(
      (progress.totalEventsLoaded ?? 0) / elapsedSeconds
    );
    const timing = `${minutes}:${seconds}, ~${eventsPerSecond} событий/с`;
    const name =
      progress.phase === "processing"
        ? `${label} — обработка ${progress.totalEventsLoaded} событий, ${timing}`
        : `${label} — пара ${progress.pairIndex}/${progress.pairTotal}, страница ${progress.page}, событий ${progress.totalEventsLoaded}, ${timing}`;

    console.log(`[Defined] ${name}; token ${tokenAddress}`);

    const [updatedRows] = await Algorithm.update(
      { name, contract: tokenAddress },
      { where: { id: 2, status: true } }
    );

    if (updatedRows === 0) {
      throw new Error("Проверка остановлена пользователем");
    }
  };
};
