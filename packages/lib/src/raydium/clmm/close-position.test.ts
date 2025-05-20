import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../env";
import { loadWalletFromFile } from "./utils";
import { closePosition } from "./close-position";

describe("", () => {
  let raydium: Raydium;

  beforeAll(async () => {
    const owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    raydium = await Raydium.load({
      owner,
      connection: new web3.Connection(getEnv("RPC_URL")),
    });
  });

  test("", async () => {
    let positions = await raydium.clmm.getOwnerPositionInfo({
      programId: CLMM_PROGRAM_ID,
    });
    positions = positions.filter((position) =>
      position.nftMint.equals(
        new web3.PublicKey("GiDTv5cU346nYTdYknM2G1Ra14GjqX5Zv7GEKA4v1t9Y")
      )
    );
    const signature = await closePosition(raydium, CLMM_PROGRAM_ID);
    console.log(signature);
  }, 5000000);
});
