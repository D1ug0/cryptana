export const isTimestampDifferenceWithinDays = (differenceSeconds, days) =>
  Number.isFinite(differenceSeconds) &&
  Math.abs(differenceSeconds) <= 60 * 60 * 24 * days;
