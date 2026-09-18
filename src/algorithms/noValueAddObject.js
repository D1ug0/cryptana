export const clearNoValueObjects = (ctx, isNoAlgoState) => {
  const noValueObjectsKey = isNoAlgoState
    ? "noValueObjects"
    : "noValueObjectsAlgo";
  if (ctx?.session && ctx.session.hasOwnProperty(noValueObjectsKey)) {
    ctx.session[noValueObjectsKey] = [];
  }
};

export const noValueAddObject = (
  ctx,
  isNoAlgoState,
  type,
  tokenContract,
  value,
  feeContract,
  timestamp
) => {
  const noValueObjectsKey = isNoAlgoState
    ? "noValueObjects"
    : "noValueObjectsAlgo";
  const noValueObjects = ctx?.session?.[noValueObjectsKey]
    ? [...ctx.session[noValueObjectsKey]]
    : [];

  let tokenGroup = noValueObjects.find(
    (tg) => tg.tokenContract === tokenContract
  );

  if (!tokenGroup) {
    tokenGroup = {
      tokenContract,
      fees: [],
      accums: [],
    };
    noValueObjects.push(tokenGroup);
  }

  if (type === "fee") {
    tokenGroup.fees.push({
      address: feeContract,
      timestamp: new Date(timestamp).getTime() / 1000,
      networkId: 1,
      value,
    });
  } else if (type === "accum") {
    tokenGroup.accums.push({
      networkId: 1,
      value,
    });
  }

  ctx.session[noValueObjectsKey] = noValueObjects;
};
