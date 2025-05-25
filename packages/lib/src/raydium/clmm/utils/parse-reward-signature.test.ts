import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../../../env";
import { loadWalletFromFile } from ".";
import { parseRewardSignatures } from "./parse-reward-signature";

describe("test rewards solana balance changes", () => {
  let raydium: Raydium;

  beforeAll(async () => {
    const owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    raydium = await Raydium.load({
      owner,
      cluster: "mainnet",
      connection: new web3.Connection(getEnv("RPC_URL")),
    });
  });

  test("Test non reward signatures, should work", async () => {
    const parsedInfo = await parseRewardSignatures(
      raydium,
      "4doaaWbzvY58vDwZmVns6gFvocgtJe84MnCGokoNWRhuovKEw3yo5g2qHrJCCi77mWYtvrzXKJnTM7vQy3T5GZvu"
    );
    console.log(parsedInfo);
  });
});
