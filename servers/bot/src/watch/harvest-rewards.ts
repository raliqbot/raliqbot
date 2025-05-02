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
  const enabledPositions = await db
    .select({
      ...getTableColumns(positions),
      wallet: getTableColumns(wallets),
    })
    .from(positions)
    .where(eq(positions.enabled, true))
    .innerJoin(wallets, eq(wallets.id, positions.wallet))
    .execute();

  const groupedPositions = new Map<
    string,
    Omit<Zod.infer<typeof selectPositionSchema>, "wallet">[]
  >();

  for (const position of enabledPositions) {
    const positions = groupedPositions.get(position.wallet.key);
    if (positions) positions.push(position);
    else groupedPositions.set(position.wallet.key, [position]);
  }

  for (const [key, positions] of groupedPositions) {
    const wallet = loadWallet({ key });
  }
};
