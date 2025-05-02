import { web3 } from "@coral-xyz/anchor";
import {
  DEV_CREATE_CPMM_POOL_PROGRAM,
  DEVNET_PROGRAM_ID,
  Raydium,
} from "@raydium-io/raydium-sdk-v2";
import { beforeAll, describe, test } from "bun:test";

import { getEnv } from "../env";
import { createPool } from "./create-pool";
import { loadWalletFromFile } from "./utils";

describe("create pool on raydium", () => {
  let raydium: Raydium;
  let owner: web3.Keypair;

  beforeAll(async () => {
    owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    raydium = await Raydium.load({
      owner,
      cluster: "devnet",
      logRequests: false,
      connection: new web3.Connection(web3.clusterApiUrl("devnet")),
    });
  });

  test("create a pool from pairs", async () => {
    const txId = await createPool(
      raydium,
      "GWvUXPxDpNiTaWKKfKLpn8ihfCLeVNLAAQtExxTCjWJp",
      "BBDZXujgbLDaskRBQWxGr8ztBL65sE9GoiFrkTnv2Spy",
      DEVNET_PROGRAM_ID.CLMM
    );



    console.log(txId);
  }, 50000000);
});
