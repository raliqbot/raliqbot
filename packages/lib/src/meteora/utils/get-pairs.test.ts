import { format } from "@raliqbot/shared";
import { NATIVE_MINT, NATIVE_MINT_2022 } from "@solana/spl-token";
import { describe, test, expect } from "bun:test";

import { get_native_mint_pool, get_pairs } from "./get-pairs";
import { clusterApiUrl, Connection, PublicKey } from "@solana/web3.js";
import { MeteoraClient } from "../api";

describe("test pair permutations for a given mints", () => {
  test("two mints permutations", () => {
    const mints = [
      NATIVE_MINT.toBase58(),
      "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    ];
    const expected = [
      format("%-%", mints[0], mints[1]),
      format("%-%", mints[1], mints[0]),
    ];

    const pairs = get_pairs(...mints);
    expect(pairs).toContainValues(expected);
  });

  test("three mints permutations", () => {
    const mints = [
      NATIVE_MINT.toBase58(),
      NATIVE_MINT_2022.toBase58(),
      "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
    ];
    const expected = [
      format("%-%", mints[0], mints[1]),
      format("%-%", mints[1], mints[0]),
      format("%-%", mints[0], mints[2]),
      format("%-%", mints[2], mints[0]),
      format("%-%", mints[1], mints[2]),
      format("%-%", mints[2], mints[1]),
    ];

    const pairs = get_pairs(...mints);
    expect(pairs).toContainValues(expected);
  });

  test("get meteora pool", async () => {
    async function getPool() {
      const pool = await get_native_mint_pool(
        new Connection(clusterApiUrl("mainnet-beta")),
        new MeteoraClient(),
        new PublicKey("4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R")
      );
    }

    expect(getPool).resolves.not.fail();
  });
});
