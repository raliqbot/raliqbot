import { beforeAll, describe, test } from "bun:test";

import { web3 } from "@coral-xyz/anchor";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../../env";
import { loadWalletFromFile } from ".";
import { getPositions } from "./get-positions";

describe("get position", () => {
  let raydium: Raydium;

  beforeAll(async () => {
    const owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    raydium = await Raydium.load({
      owner,
      cluster: "mainnet",
      connection: new web3.Connection(getEnv("RPC_URL")),
    });
  });

  test("schema tests", async () => {
    console.log(await raydium.account.fetchWalletTokenAccounts());
    const [
      {
        pool,
        positions: [position],
      },
    ] = await getPositions(raydium, CLMM_PROGRAM_ID);
    console.log("pool=", pool.poolInfo.id);
    console.log("amountA=", position.amountA.toString());
    console.log("amountB", position.amountB.toString());
    for (const rewardInfo of position.detailedRewardInfos)
      console.log(rewardInfo.amount.toString(), rewardInfo.mint.symbol);
  });
});
