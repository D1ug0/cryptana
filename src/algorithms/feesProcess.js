import Big from "big.js";
import { toFixedNumber } from "../helpers/utils.js";
import { isTimestampDifferenceWithinDays } from "../helpers/time.js";
import { getTokenPrices } from "./definedTest/query/getTokenPrices.js";

export const feesProcess = async (ctx, isNoAlgoState) => {
  // используем нужно состояние сессии
  const noValueObjectsKey = isNoAlgoState
    ? "noValueObjects"
    : "noValueObjectsAlgo";

  const allnoValueObjects = ctx?.session?.[noValueObjectsKey]
    ? [...ctx.session[noValueObjectsKey]]
    : [];
  // под запрос делаем специальный мап коммисиий и накоплений
  const noValueObjects = allnoValueObjects.filter((el) => el.fees.length > 0);
  const allNoValueObjects = noValueObjects.flatMap((item) =>
    item.fees.map(({ value, ...rest }) => rest)
  );

  // максимум 25 объектов за 1 запрос
  const batchSize = 25;

  // массив под ответ из запроса
  const tokenPrices = [];

  // цикл выполнения запросов, которые получают цену
  for (let i = 0; i < allNoValueObjects.length; i += batchSize) {
    const batchObjects = allNoValueObjects.slice(i, i + batchSize);

    const fetchTokensPrices = await getTokenPrices({ batchObjects });

    tokenPrices.push(...fetchTokensPrices);
  }

  // индекс актуального свободного элемента комисии/накопления
  let currentIndex = 0;

  // проход по начальному массиву и преобразования в новый с использованием данных от запроса
  const updatedObjects = noValueObjects.map((oneObj) => {
    // создание экземпляра нового объекта
    const newObj = {
      tokenContract: oneObj.tokenContract,
      fee: new Big(0),
    };

    // функция для складывания либо комиссий, либо накоплений

    for (let j = 0; j < oneObj.fees.length; j++) {
      // текущий объект данных из ответа с сервера комиссий и накоплений в $
      const respObj = tokenPrices[currentIndex];
      let isValid;
      if (respObj) {
        isValid =
          isTimestampDifferenceWithinDays(
            Number(oneObj.fees[j].timestamp) - Number(respObj.timestamp),
            14
          ) &&
          Number(respObj.priceUsd) > 0 &&
          Number(respObj.priceUsd) < 1000000;

        newObj.fee = newObj.fee.plus(
          oneObj.fees[j].value.times(
            isValid ? new Big(respObj.priceUsd) : new Big(0)
          )
        );
      }

      currentIndex++;
    }

    return {
      ...newObj,
      fee: toFixedNumber(newObj.fee),
    };
  });

  return updatedObjects;
};
