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
  // mint: "So11111111111111111111111111111111111111112",

  test("open a position with a single token", async () => {
    const tx = await createPosition(
      raydium,
      {
        slippage: 0.05,
        tickPercentage: [0, 0.00154],
        // tickPercentage: [0.0015, 0.00154],
        poolId: "BZtgQEyS6eXUXicYPHecYQ7PybqodXQMvkjUbP4R8mUU",
        input: {
          mint: "So11111111111111111111111111111111111111112",
          amount: 1,
        },
      }
      // {
      //   tokenASwapConfig: {
      //     poolId: "5mjMuhZenZpHX5PBHepdtQNPXrcg2qPQ54yNtEqnukAK",
      //   },
      //   tokenBSwapConfig: {
      //     poolId: "7MZadGscoyyGL9Ut3Whm6EshnuACt6Fkgat23F1NmFrq",
      //   },
      // }
    );
    console.log(JSON.stringify(tx));
  }, 5000000);
});
