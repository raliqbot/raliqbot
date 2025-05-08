import {
  boolean,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { pools } from "./pools";
import { wallets } from "./wallets";

export type PositionMetadata = {
  entryPrice: number;
  startPrice: number;
  endPrice: number;
  epochTime: number;
  stopLossPercentage: number;
};

export const positions = pgTable("positions", {
  id: text().primaryKey(),
  pool: text()
    .references(() => pools.id)
    .notNull(),
  wallet: uuid()
    .references(() => wallets.id)
    .notNull(),
  algorithm: text({ enum: ["spot", "single-sided"] }).notNull(),
  metadata: jsonb().$type<PositionMetadata>().notNull(),
  enabled: boolean().default(true).notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp().defaultNow().notNull(),
});
