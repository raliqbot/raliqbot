import { describe, test, beforeAll } from "bun:test";
import { Connection, Keypair } from "@solana/web3.js";

import { getEnv } from "../../env";
import { MeteoraClient } from "../api";
import { loadWalletFromFile } from "../../utils";
import { get_token_balance_change_from_signatures } from "./get-tokens-balance-change";

describe("test get-tokens-balance-change", () => {
  let owner: Keypair;
  let connection: Connection, client: MeteoraClient;

  beforeAll(async () => {
    owner = loadWalletFromFile(getEnv("DEV_WALLET"));
    connection = new Connection(getEnv("RPC_URL"));
  });

  test("get a single signature.", async () => {
    const token_changes = await get_token_balance_change_from_signatures(
      connection,
      "SG3SnVHjVQsLNB3rdzoedsx2yGiAjTyx5CRQVPntvGC5i8d8FtXDjTPBGyDXEj9ConntncfGJfQfH3oVyvs54bE"
    );

    console.log(token_changes);
  });
});
