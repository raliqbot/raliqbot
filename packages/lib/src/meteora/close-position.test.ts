import DLMM from "@meteora-ag/dlmm";
import { describe, test, beforeAll } from "bun:test";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import { getEnv } from "../env";
import { MeteoraClient } from "./api";
import { loadWalletFromFile } from "../utils";
import { close_position } from "./close-position";

describe("test close-position", () => {
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

  test("remove liquidity and close position", async () => {
    const { positions, execute } = await close_position(
      connection,
      pool,
      owner
    );

    console.log(
      "position=",
      positions.map((position) => position.publicKey.toBase58())
    );
    console.log("signature=", await execute());
  });
});
``;
