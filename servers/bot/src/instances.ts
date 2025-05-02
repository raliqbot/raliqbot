import { web3 } from "@coral-xyz/anchor";
import { DexScreener } from "@raliqbot/lib";

import { createDB } from "./db";
import { getEnv } from "./core";

export const db = createDB(getEnv("DATABASE_URL"));
export const dexscreemer = new DexScreener();
export const connection = new web3.Connection(web3.clusterApiUrl("devnet"));
export const secretKey = Buffer.from(getEnv("SECRET_KEY")!, "hex")
  .subarray(0, 16)
  .toString("hex");
