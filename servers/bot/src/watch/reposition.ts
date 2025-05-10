import moment from "moment";
import { web3 } from "@coral-xyz/anchor";
import { and, eq, lte } from "drizzle-orm";
import { getPool} from "@raliqbot/lib";
import { CLMM_PROGRAM_ID, Raydium } from "@raydium-io/raydium-sdk-v2";

import { getEnv } from "../core";
import type { Database } from "../db";
import { positions } from "../db/schema";
import { loadWallet } from "../controllers/wallets.controller";

export const reposition = async (
  db: Database,
  connection: web3.Connection
) => {};
