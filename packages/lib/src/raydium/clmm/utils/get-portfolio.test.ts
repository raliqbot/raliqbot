import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../../env";
import { loadWalletFromFile } from ".";
import { BitQuery } from "../../../bitquery";
import { getPortfolio } from "./get-portfolio";
import { DexScreener } from "../../../dexscreener";

describe("fetch wallet portfolio", () => {
  let wallet;
  let raydium: Raydium;
  let bitquery: DexScreener;

  beforeAll(async () => {
    wallet = loadWalletFromFile(getEnv("DEV_WALLET"));
    bitquery = new DexScreener();
    raydium = await Raydium.load({
      owner: wallet,
      connection: new web3.Connection(web3.clusterApiUrl("mainnet-beta")),
    });
  });

  test("should return porfolio", async () => {
    const portfolio = await getPortfolio(raydium, bitquery, CLMM_PROGRAM_ID);
    console.log(
      JSON.stringify(
        portfolio.map(({ positions }) => positions),
        undefined,
        2
      )
    );
  }, 5000000);
});
