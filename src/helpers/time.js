export const isTimestampDifferenceWithinDays = (differenceSeconds, days) =>
  Number.isFinite(differenceSeconds) &&
  Math.abs(differenceSeconds) <= 60 * 60 * 24 * days;

export const isWithinLast14Days = (date, now = Date.now()) => {
  const timestamp = new Date(date).getTime();
  const currentTimestamp = new Date(now).getTime();
  const age = currentTimestamp - timestamp;

  return (
    Number.isFinite(timestamp) &&
    Number.isFinite(currentTimestamp) &&
    age >= 0 &&
    age <= 14 * 24 * 60 * 60 * 1000
  );
};
