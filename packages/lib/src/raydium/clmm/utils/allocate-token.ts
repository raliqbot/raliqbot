import assert from "assert";

export function getAllocateTokens(
  [start, end]: [number, number],
  amount: number,
  bias = 1
) {
  assert(
    !(start === 0 && end === 0),
    "Invalid range values, both start and end cannot be zero."
  );

  let startWeight: number, endWeight: number;

  // Handle zero safely
  if (start === 0) startWeight = Number.POSITIVE_INFINITY;
  else startWeight = (1 / start) ** bias;

  if (end === 0) endWeight = Number.POSITIVE_INFINITY;
  else endWeight = (1 / end) ** bias;

  const totalWeight = startWeight + endWeight;

  let swapAAmount: number, swapBAmount: number;

  if (!isFinite(startWeight)) {
    swapAAmount = amount;
    swapBAmount = 0;
  } else if (!isFinite(endWeight)) {
    swapAAmount = 0;
    swapBAmount = amount;
  } else {
    swapAAmount = (startWeight / totalWeight) * amount;
    swapBAmount = amount - swapAAmount;
  }

  return [swapAAmount, swapBAmount];
}
