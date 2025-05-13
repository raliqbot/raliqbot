export function getAllocateTokens(
  [a, b]: [number, number],
  total: number,
  bais?: boolean
): [number, number] {
  if (bais) {
    if (a === 0 && b === 0) return [total / 2, total / 2];
    if (a === 0) return [total, 0];
    if (b === 0) return [0, total];

    const inverseA = 1 / a;
    const inverseB = 1 / b;
    const sum = inverseA + inverseB;

    const weightA = inverseB / sum;
    const weightB = inverseA / sum;

    return [total * weightA, total * weightB];
  }

  return [total / 2, total / 2];
}