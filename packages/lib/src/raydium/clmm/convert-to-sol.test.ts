import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../env";
import { closePosition } from "./close-position";
import { getPositions, loadWalletFromFile } from "./utils";
import { convertTokenBalanceChangesToSOL } from "./convert-to-sol";

describe("", () => {
  let raydium: Raydium;

  beforeAll(async () => {
    const owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    raydium = await Raydium.load({
      owner,
      cluster: "mainnet",
      connection: new web3.Connection(getEnv("RPC_URL")),
    });
  });

  test("swap to solana from signatures", async () => {
    let signatures = await convertTokenBalanceChangesToSOL(
      raydium,
      0.1,
      "PtSbSY2PjFAedXBZcQWmzYaLSe4BRzKdZZQxKp8kYj1jEYsWrdVe3MYnMfxKotzZHD9Ubcn4SM2coRrR2KjeubN"
    );

    console.log(signatures);
  }, 5000000);
});
