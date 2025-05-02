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
      cluster: "devnet",
      connection: new web3.Connection(web3.clusterApiUrl("devnet")),
    });
  });

  test("open a position with a single token", async () => {
    const tx = await createPosition(
      raydium,
      { mint: "GWvUXPxDpNiTaWKKfKLpn8ihfCLeVNLAAQtExxTCjWJp", amount: 10 },
      "2byeyx1ynRhLudcetkHWnsKLUAVtGN7ktMxDV7fzjnjn",
      [0.1, 1.5],
      0
    );
    console.log(JSON.stringify(tx));
  }, 5000000);
});
