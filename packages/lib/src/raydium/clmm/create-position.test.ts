import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../env";
import { loadWalletFromFile } from "./utils";
import { createPosition } from "./create-position";

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
    await createPosition(raydium, {
      slippage: 0.05,
      rangeBias: false,
      range: [0.11, 0.09],
      poolId: "5PyWWaKfwcz3rDnA4Y6t5bDzvh3vZMHTtXJfFtP9uAtd",
      input: {
        mint: "So11111111111111111111111111111111111111112",
        amount: 0.1,
      },
    });
  }, 5000000);
});
