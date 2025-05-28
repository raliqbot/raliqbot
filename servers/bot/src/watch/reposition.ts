import z from "zod";
import moment from "moment";
import { Telegraf } from "telegraf";
import { web3 } from "@coral-xyz/anchor";
import { and, eq, lte } from "drizzle-orm";
import { getPool, getPortfolio } from "@raliqbot/lib";
import {
  type ApiV3PoolInfoConcentratedItem,
  TickUtils,
} from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../core";
import type { Database } from "../db";
import { positions } from "../db/schema";
import { loadWallet } from "../controllers/wallets.controller";
import { selectWalletSchema, selectUserSchema } from "../db/zod";

export const reposition = async (
  db: Database,
  bot: Telegraf,
  poolInfo: ApiV3PoolInfoConcentratedItem,
  position: Awaited<
    ReturnType<typeof getPortfolio>
  >[number]["positions"][number],
  currentTickAndPrice: ReturnType<typeof TickUtils.getTickPrice>,
  wallet: z.infer<typeof selectWalletSchema> & {
    user: z.infer<typeof selectUserSchema>;
  }
) => {
  // first close position 
};
