import { mean } from "lodash";

export function avgRanges(ranges: number[], value: number) {
  if (ranges.length === 0) return 0;

  const sum = ranges.reduce((accumulator, current) => accumulator + current, 0);

  return sum / ranges.length;
}

export const recommendRange = (
  defaultRanges: number[],
  priceIncrement: number
): [number, number] => {
  const avgRange = mean(defaultRanges);
  console.log("defaultRanges=", defaultRanges);
  console.log("avgRange=", avgRange);
  console.log("priceIncrement=", priceIncrement);
  let [lowerBound, upperBound] = [avgRange, avgRange];
  console.log(lowerBound, upperBound);
  if (priceIncrement > 0) upperBound = Math.min(upperBound + priceIncrement, 1);
  else if (lowerBound >= upperBound)
    lowerBound = Math.min(lowerBound + priceIncrement, 1);

  console.log(lowerBound, upperBound);
  return [lowerBound, upperBound];
};
