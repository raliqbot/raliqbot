import { eq, SQL } from "drizzle-orm";
import { Database } from "../db";
import { positions } from "../db/schema";
import { insertPositionSchema, selectPositionSchema } from "../db/zod";
import { PositionInfoLayout } from "@raydium-io/raydium-sdk-v2";

export const createPositions = (
  db: Database,
  ...values: Zod.infer<typeof insertPositionSchema>[]
) => db.insert(positions).values(values).returning().execute();

export const cacheOnChainPositions = (
  db: Database,
  wallet: string,
  onChainPositions: ReturnType<typeof PositionInfoLayout.decode>[]
) => {
  const values = onChainPositions.map((position) => ({
    wallet,
    id: position.nftMint.toBase58(),
    pool: position.poolId.toBase58(),
    metadata: {
      amountA: 0,
      amountB: 0,
      lowerTick: position.tickLower,
      upperTick: position.tickUpper,
      liquidity: position.liquidity.toString(),
    },
    enabled: false,
    algorithm: "spot" as const,
  }));

  return db
    .insert(positions)
    .values(values)
    .returning()
    .onConflictDoNothing()
    .execute();
};

export const getPositionById = (
  db: Database,
  id: Zod.infer<typeof selectPositionSchema>["id"]
) =>
  db.query.positions
    .findFirst({
      where: eq(positions.id, id),
    })
    .execute();

export const getPositionsWhere = (db: Database, where: SQL<unknown>) =>
  db.query.positions.findMany({ where }).execute();

export const updatePositionById = (
  db: Database,
  id: Zod.infer<typeof selectPositionSchema>["id"],
  value: Partial<Zod.infer<typeof insertPositionSchema>>
) =>
  db
    .update(positions)
    .set(value)
    .where(eq(positions.id, id))
    .returning()
    .execute();
