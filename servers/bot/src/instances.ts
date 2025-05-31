import { Telegraf } from "telegraf";
import { web3 } from "@coral-xyz/anchor";
import { BitQuery, DexScreener } from "@raliqbot/lib";

import { createDB } from "./db";
import { getEnv } from "./core";

export const db = createDB(getEnv("DATABASE_URL"));
export const bot = new Telegraf(getEnv("TELEGRAM_BOT_API_KEY"));
export const bitquery = new BitQuery(getEnv("BITQUERY_API_KEY"));
export const dexscreener = new DexScreener();
export const connection = new web3.Connection(getEnv("RPC_URL"), {
  commitment: "confirmed",
});
export const secretKey = Buffer.from(getEnv("SECRET_KEY")!, "hex")
  .subarray(0, 16)
  .toString("hex");
