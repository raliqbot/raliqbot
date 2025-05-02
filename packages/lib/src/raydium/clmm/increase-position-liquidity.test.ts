import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { DEVNET_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../env";
import { loadWalletFromFile } from "./utils";
import { increatePositionLiquidity } from "./increase-position-liquidity";

describe("increase pool liquidity", () => {
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

  test("get a position and increase liquidity", async () => {
    const positions = await raydium.clmm.getOwnerPositionInfo({
      programId: DEVNET_PROGRAM_ID.CLMM,
    });

    if (positions.length > 0) {
      const [position] = positions;
      const signature = await increatePositionLiquidity(
        raydium,
        position,
        { mint: "GWvUXPxDpNiTaWKKfKLpn8ihfCLeVNLAAQtExxTCjWJp", amount: 10 },
        0.5
      );

      console.log(signature);
    }
  }, 5000000);
});
