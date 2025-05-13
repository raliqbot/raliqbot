import { AssertionError } from "assert";
import { describe, expect, test } from "bun:test";

import { getAllocateTokens } from "./allocate-token";

describe("allocate tokens with range", () => {
  test("throw error if both is zero", () => {
    const allocate = () => {
      return getAllocateTokens([0, 0], 100, true);
    };
    expect(allocate).toThrowError(AssertionError);
  });

  test("start delta more than end delta output", () => {
    const [swapAAmount, swapBAmount] = getAllocateTokens([0.1, 0.2], 100, true);
    expect(swapAAmount).toBeGreaterThan(swapBAmount);
  });

  test("end delta more than start delta output", () => {
    const [swapAAmount, swapBAmount] = getAllocateTokens([0.2, 0.1], 100, true);
    expect(swapBAmount).toBeGreaterThan(swapAAmount);
  });

  test("start delta more than start delta output", () => {
    const [swapAAmount, swapBAmount] = getAllocateTokens([0, 0.1], 100, true);
    expect(swapAAmount).toBeGreaterThan(swapBAmount);
  });

  test("end delta more than start delta output", () => {
    const [swapAAmount, swapBAmount] = getAllocateTokens([0.2, 0], 100, true);
    expect(swapBAmount).toBeGreaterThan(swapAAmount);
  });
});
