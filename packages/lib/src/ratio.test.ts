import { format } from "@raliqbot/shared";
import { NATIVE_MINT, NATIVE_MINT_2022 } from "@solana/spl-token";
import { describe, test, expect } from "bun:test";
import { Ratio } from "./ratio";

describe("test ratio", () => {
  test("two decimal ratios", () => {
    const ratio = new Ratio(0.1, 0.9);
    expect(ratio.a).toBe(10);
    expect(ratio.b).toBe(90);
  });

  test("two number ratios", () => {
    const ratio = new Ratio(20, 80);
    expect(ratio.a).toBe(20);
    expect(ratio.b).toBe(80);
  });
});
