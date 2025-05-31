import { web3 } from "@coral-xyz/anchor";
import { beforeAll, describe, test } from "bun:test";
import { Raydium } from "@raydium-io/raydium-sdk-v2";
import { getPoolById } from "./get-pool-by-id";

describe("get-pool", () => {
  let raydium: Raydium;

  beforeAll(async () => {
    raydium = await Raydium.load({
      connection: new web3.Connection(web3.clusterApiUrl("mainnet-beta")),
    });
  });

  test("fetch a pool", async () => {
    const pool = await getPoolById(
      raydium,
      "3MjwoqZHAAbCQLBSn6DtmgL6rpazvgYaxBYGHaxiQYTx"
    );
    console.log(pool.poolInfo.config);
  });
});
