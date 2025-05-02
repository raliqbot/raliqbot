import { boolean, jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { pools } from "./pools";
import { wallets } from "./wallets";

export type PositionMetadata = {
  entryPrice: number;
  lowerBound: number;
  upperBound: number;
  stopLossPercentage: number;
  epochTime: number;
};

export const positions = pgTable("positions", {
  id: text().primaryKey(),
  pool: text()
    .references(() => pools.id)
    .notNull(),
  wallet: uuid()
    .references(() => wallets.id)
    .notNull(),
  metadata: jsonb().$type<PositionMetadata>().notNull(),
  enabled: boolean().default(true).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
});
