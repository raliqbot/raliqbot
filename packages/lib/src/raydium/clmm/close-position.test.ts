import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../env";
import { closePosition } from "./close-position";
import { getPositions, loadWalletFromFile } from "./utils";

describe("close-position-test", () => {
  let raydium: Raydium;

  beforeAll(async () => {
    const owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    raydium = await Raydium.load({
      owner,
      cluster: "mainnet",
      connection: new web3.Connection(getEnv("RPC_URL")),
    });
  });

  test("close position", async () => {
    let poolWithPositions = await getPositions(
      raydium,
      CLMM_PROGRAM_ID,
      "CN7UCncok5NrfRu1hikpjWvTomJrDHnPHzrVRTaZSXDk"
    );
    const signature = await closePosition(raydium, poolWithPositions);
    console.log(signature);
  }, 5000000);
});
