import { NATIVE_MINT } from "@solana/spl-token";
import { describe, test, beforeAll } from "bun:test";
import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { getEnv } from "../env";
import { Ratio } from "../ratio";
import { MeteoraClient } from "./api";
import { loadWalletFromFile } from "../utils";
import { create_position } from "./create-position";

describe("test create-position", () => {
  let pool: DLMM;
  let owner: Keypair;
  let connection: Connection, client: MeteoraClient;

  beforeAll(async () => {
    client = new MeteoraClient();
    owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    connection = new Connection(getEnv("RPC_URL"));
    pool = await DLMM.create(
      connection,
      new PublicKey("5rCf1DM8LjKTw4YqhnoLcngyZYeNnQqztScTogYHAS6")
    );
  });

  test("create a simple position", async () => {
    const { position, execute } = await create_position({
      pool,
      owner,
      client,
      connection,
      slippage: 1,
      ratio: new Ratio(0.5, 0.5),
      input: {
        mint: NATIVE_MINT,
        amount: 0.2,
      },
      strategyType: StrategyType.Spot,
      rangeIntervals: [10, 10],
    });

    console.log("position=", position.publicKey.toBase58());
    console.log("signature=", await execute());
  });
});
