import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../env";
import { loadWalletFromFile } from "./utils";
import { simulateCreatePosition } from "./simulate-create-position";

describe("open position on raydium", async () => {
  let raydium: Raydium;
  let owner: web3.Keypair;

  beforeAll(async () => {
    owner = loadWalletFromFile(getEnv("DEV_WALLET"));

    raydium = await Raydium.load({
      owner,
      cluster: "mainnet",
      connection: new web3.Connection(
        "https://smart-proportionate-dew.solana-mainnet.quiknode.pro/c852fdbf045b068fb359cad845b4cc95c99738b1/"
      ),
    });
  });

  test("open a position with a single token", async () => {
    await simulateCreatePosition(raydium, await raydium.fetchEpochInfo(), {
      slippage: 0.05,
      rangeBias: false,
      range: [0.091, 0],
      poolId: "E5X7mWprg8pdAqBT5HJ1ehu4crAsgUkUX5MwCjuTusZU",
      input: {
        mint: "So11111111111111111111111111111111111111112",
        amount: 1,
      },
    });
  }, 5000000);
});
