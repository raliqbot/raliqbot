import type { web3 } from "@coral-xyz/anchor";

import type { Database } from "../db";
import { eq, getTableColumns } from "drizzle-orm";
import { positions, wallets } from "../db/schema";
import type { selectPositionSchema } from "../db/zod";
import { loadWallet } from "../controllers/wallets.controller";

export const harvestRewards = async (
  db: Database,
  connection: web3.Connection
) => {
  
};
