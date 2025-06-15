import { Telegraf } from "telegraf";
import { Connection } from "@solana/web3.js";
import { DexScreener, MeteoraClient } from "@raliqbot/lib";

import { createDB } from "./db";
import { getEnv } from "./core";

export const db = createDB(getEnv("DATABASE_URL"));
export const bot = new Telegraf(getEnv("TELEGRAM_BOT_API_KEY"));
export const meteora = new MeteoraClient();
export const dexscreener = new DexScreener();
export const connection = new Connection(getEnv("RPC_URL"), {
  commitment: "confirmed",
});
export const secretKey = Buffer.from(getEnv("SECRET_KEY")!, "hex")
  .subarray(0, 16)
  .toString("hex");
